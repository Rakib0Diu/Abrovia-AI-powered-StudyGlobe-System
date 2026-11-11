#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${API_URL:-http://localhost:5000/api}"
echo "=== StudyGlobe Backend Smoke Tests ($BASE_URL) ==="

# 1. GET /health
echo "1. Checking GET /health ..."
HEALTH_RESP=$(curl -sS -w "\n%{http_code}" "$BASE_URL/health")
HEALTH_BODY=$(echo "$HEALTH_RESP" | sed '$d')
HEALTH_CODE=$(echo "$HEALTH_RESP" | tail -n1)
if [ "$HEALTH_CODE" != "200" ]; then
  echo "FAIL: /health returned $HEALTH_CODE ($HEALTH_BODY)"
  exit 1
fi
echo "   OK: $HEALTH_BODY"

# 2. GET /countries (count > 0)
echo "2. Checking GET /countries ..."
COUNTRIES_RESP=$(curl -sS "$BASE_URL/countries")
COUNTRIES_COUNT=$(node -e "const d = JSON.parse(process.argv[1]); console.log(d.count || 0);" "$COUNTRIES_RESP")
if [ "$COUNTRIES_COUNT" -le 0 ]; then
  echo "FAIL: expected countries count > 0, got $COUNTRIES_COUNT"
  exit 1
fi
echo "   OK: count = $COUNTRIES_COUNT"

# 3. GET /universities?sort=ranking
echo "3. Checking GET /universities?sort=ranking ..."
UNI_RANK_RESP=$(curl -sS -w "\n%{http_code}" "$BASE_URL/universities?sort=ranking")
UNI_RANK_CODE=$(echo "$UNI_RANK_RESP" | tail -n1)
if [ "$UNI_RANK_CODE" != "200" ]; then
  echo "FAIL: /universities?sort=ranking returned $UNI_RANK_CODE"
  exit 1
fi
echo "   OK: status 200"

# 4. GET /universities?degree_level=Master&max_tuition=20000
echo "4. Checking GET /universities?degree_level=Master&max_tuition=20000 ..."
UNI_FILTER_RESP=$(curl -sS -w "\n%{http_code}" "$BASE_URL/universities?degree_level=Master&max_tuition=20000")
UNI_FILTER_CODE=$(echo "$UNI_FILTER_RESP" | tail -n1)
if [ "$UNI_FILTER_CODE" != "200" ]; then
  echo "FAIL: filtered /universities returned $UNI_FILTER_CODE"
  exit 1
fi
echo "   OK: status 200"

# 5. GET /programs/fields
echo "5. Checking GET /programs/fields ..."
FIELDS_RESP=$(curl -sS -w "\n%{http_code}" "$BASE_URL/programs/fields")
FIELDS_CODE=$(echo "$FIELDS_RESP" | tail -n1)
if [ "$FIELDS_CODE" != "200" ]; then
  echo "FAIL: /programs/fields returned $FIELDS_CODE"
  exit 1
fi
echo "   OK: status 200"

# 6. POST /scholarships/assess
echo "6. Checking POST /scholarships/assess ..."
ASSESS_RESP=$(curl -sS -w "\n%{http_code}" -X POST "$BASE_URL/scholarships/assess" \
  -H "Content-Type: application/json" \
  -d '{"gpa": 3.5, "ielts": 6.5}')
ASSESS_CODE=$(echo "$ASSESS_RESP" | tail -n1)
if [ "$ASSESS_CODE" != "200" ]; then
  echo "FAIL: /scholarships/assess returned $ASSESS_CODE"
  exit 1
fi
echo "   OK: status 200"

# 7. Register throw-away user
TEST_EMAIL="smoke_$(date +%s)_$RANDOM@example.com"
TEST_PASS="SmokeTest123!"
echo "7. Registering throw-away user ($TEST_EMAIL) ..."
REG_RESP=$(curl -sS -w "\n%{http_code}" -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASS\",\"full_name\":\"Smoke Tester\"}")
REG_BODY=$(echo "$REG_RESP" | sed '$d')
REG_CODE=$(echo "$REG_RESP" | tail -n1)
if [ "$REG_CODE" != "201" ]; then
  echo "FAIL: /auth/register returned $REG_CODE ($REG_BODY)"
  exit 1
fi
echo "   OK: status 201"

# 8. Log in as throw-away user
echo "8. Logging in ($TEST_EMAIL) ..."
LOGIN_RESP=$(curl -sS -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASS\"}")
LOGIN_BODY=$(echo "$LOGIN_RESP" | sed '$d')
LOGIN_CODE=$(echo "$LOGIN_RESP" | tail -n1)
if [ "$LOGIN_CODE" != "200" ]; then
  echo "FAIL: /auth/login returned $LOGIN_CODE ($LOGIN_BODY)"
  exit 1
fi
ACCESS_TOKEN=$(node -e "const d = JSON.parse(process.argv[1]); console.log(d.access_token || '');" "$LOGIN_BODY")
if [ -z "$ACCESS_TOKEN" ]; then
  echo "FAIL: missing access_token in login response"
  exit 1
fi
echo "   OK: received access_token"

# 9. GET /auth/me
echo "9. Checking GET /auth/me ..."
ME_RESP=$(curl -sS -w "\n%{http_code}" "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
ME_CODE=$(echo "$ME_RESP" | tail -n1)
if [ "$ME_CODE" != "200" ]; then
  echo "FAIL: /auth/me returned $ME_CODE"
  exit 1
fi
echo "   OK: status 200"

# 10. PUT /profile
echo "10. Checking PUT /profile ..."
PROFILE_RESP=$(curl -sS -w "\n%{http_code}" -X PUT "$BASE_URL/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"gpa": 3.75, "ielts_score": 7.0, "preferred_degree_level": "Master", "budget_max": 25000}')
PROFILE_CODE=$(echo "$PROFILE_RESP" | tail -n1)
if [ "$PROFILE_CODE" != "200" ]; then
  echo "FAIL: PUT /profile returned $PROFILE_CODE"
  exit 1
fi
echo "   OK: status 200"

# 11. Verify GET /admin/countries returns 403 for non-admin
echo "11. Verifying GET /admin/countries returns 403 for non-admin ..."
ADMIN_RESP=$(curl -sS -w "\n%{http_code}" "$BASE_URL/admin/countries" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
ADMIN_CODE=$(echo "$ADMIN_RESP" | tail -n1)
if [ "$ADMIN_CODE" != "403" ]; then
  echo "FAIL: expected 403 for non-admin on /admin/countries, got $ADMIN_CODE"
  exit 1
fi
echo "   OK: received expected 403 Forbidden"

echo "=== All smoke tests passed! ==="

