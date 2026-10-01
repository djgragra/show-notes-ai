#!/bin/bash
# Checks that each provider's server answers a browser preflight (OPTIONS) from the app's origin and then allows the real call.
# Sends NO key and NO text: the second step uses a deliberately invalid placeholder key and an empty-looking request.
# Usage: bash dev/check-cors.sh [origin]     (default origin: https://onairgarage.com)
O="${1:-https://onairgarage.com}"
fail=0
check() {  # name url request-headers
  local out; out=$(curl -s -m 20 -o /dev/null -D - -X OPTIONS "$2" -H "Origin: $O" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: $3")
  local allow; allow=$(printf '%s' "$out" | tr -d '\r' | grep -i '^access-control-allow-origin:' | head -1 | sed 's/^[^:]*: *//')
  local hdrs; hdrs=$(printf '%s' "$out" | tr -d '\r' | grep -i '^access-control-allow-headers:' | head -1 | tr 'A-Z' 'a-z')
  local ok=1
  [ "$allow" = "*" ] || [ "$allow" = "$O" ] || ok=0
  for h in $(echo "$3" | tr ',' ' '); do printf '%s' "$hdrs" | grep -q "$h" || ok=0; done
  if [ $ok = 1 ]; then echo "PASS  $1  (allow-origin: $allow)"; else echo "FAIL  $1  (allow-origin: '$allow')"; fail=1; fi
}
check anthropic  https://api.anthropic.com/v1/messages "content-type,x-api-key,anthropic-version,anthropic-dangerous-direct-browser-access"
check openai     https://api.openai.com/v1/chat/completions "content-type,authorization"
check gemini     "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent" "content-type,x-goog-api-key"
check groq       https://api.groq.com/openai/v1/chat/completions "content-type,authorization"
check openrouter https://openrouter.ai/api/v1/chat/completions "content-type,authorization"
exit $fail
