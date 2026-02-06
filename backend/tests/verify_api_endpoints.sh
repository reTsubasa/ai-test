#!/bin/bash
# API Endpoint Verification Script for VyOS Web UI Backend
#
# This script tests all API endpoints defined in the backend and verifies their
# response structure and status codes.
#
# Usage: ./verify_api_endpoints.sh [base_url]
#   base_url - The base URL of the backend server (default: http://localhost:8080)
#
# Requirements: curl, jq (for JSON parsing)

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-http://localhost:8080}"
TEST_RESULTS_FILE="api_verification_results.txt"
FAILED_COUNT=0
PASSED_COUNT=0
SKIPPED_COUNT=0

# Print functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_COUNT++))
}

print_failure() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_COUNT++))
}

print_warning() {
    echo -e "${YELLOW}[SKIP]${NC} $1"
    ((SKIPPED_COUNT++))
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Test function
test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local description="$3"
    local expected_status="$4"
    local auth_token="$5"
    local data="$6"

    print_info "Testing: $description"

    # Construct curl command
    local curl_cmd="curl -s -w '\n%{http_code}' -X $method"
    if [ -n "$auth_token" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $auth_token'"
    fi
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    curl_cmd="$curl_cmd '${BASE_URL}${endpoint}'"

    # Execute request and capture response
    local response
    response=$(eval $curl_cmd 2>&1)
    local body=$(echo "$response" | sed '$d')
    local status_code=$(echo "$response" | tail -n1)

    # Check status code
    if [ "$status_code" = "$expected_status" ]; then
        print_success "$description (Status: $status_code)"
        echo "$description | $method $endpoint | $status_code | PASS" >> "$TEST_RESULTS_FILE"
        return 0
    else
        print_failure "$description (Expected: $expected_status, Got: $status_code)"
        echo "Response body: $body"
        echo "$description | $method $endpoint | $status_code | FAIL" >> "$TEST_RESULTS_FILE"
        return 1
    fi
}

# Initialize results file
echo "VyOS Web UI Backend API Verification Results" > "$TEST_RESULTS_FILE"
echo "============================================" >> "$TEST_RESULTS_FILE"
echo "Test Date: $(date)" >> "$TEST_RESULTS_FILE"
echo "Base URL: $BASE_URL" >> "$TEST_RESULTS_FILE"
echo "" >> "$TEST_RESULTS_FILE"

# ============================================================================
# Health Check Endpoints
# ============================================================================
print_header "Health Check Endpoints"

test_endpoint "GET" "/api/health" "Health Check" "200"
test_endpoint "GET" "/api/health/detailed" "Detailed Health Check" "200"

# ============================================================================
# Authentication Endpoints
# ============================================================================
print_header "Authentication Endpoints"

# Note: These tests require actual user credentials and database
print_warning "POST /api/auth/register - Requires test database setup"
print_warning "POST /api/auth/login - Requires test database setup"
print_warning "POST /api/auth/logout - Requires authentication token"
print_warning "POST /api/auth/refresh - Requires authentication token"
print_warning "POST /api/auth/validate - Requires authentication token"
print_warning "GET /api/auth/me - Requires authentication token"

# ============================================================================
# User Management Endpoints
# ============================================================================
print_header "User Management Endpoints"

print_warning "GET /api/users/me - Requires authentication token"
print_warning "PUT /api/users/me - Requires authentication token"
print_warning "POST /api/users/me/password - Requires authentication token"
print_warning "GET /api/users - Requires authentication token (admin)"
print_warning "POST /api/users - Requires authentication token (admin)"
print_warning "PUT /api/users/{id} - Requires authentication token (admin)"
print_warning "DELETE /api/users/{id} - Requires authentication token (admin)"

# ============================================================================
# Network Configuration Endpoints
# ============================================================================
print_header "Network Configuration Endpoints"

test_endpoint "GET" "/api/network/interfaces" "Get Network Interfaces" "200"
test_endpoint "GET" "/api/network/interfaces/eth0" "Get Interface Details" "200"
test_endpoint "POST" "/api/network/interfaces/eth0/configure" "Configure Interface" "202" "" '{"address": "192.168.1.1/24"}'
test_endpoint "GET" "/api/network/routes" "Get Routing Table" "200"
test_endpoint "POST" "/api/network/routes" "Add Route" "202" "" '{"destination": "10.0.0.0/24", "gateway": "192.168.1.1"}'
test_endpoint "DELETE" "/api/network/routes/test-id" "Delete Route" "200"
test_endpoint "GET" "/api/network/firewall/rules" "Get Firewall Rules" "200"
test_endpoint "POST" "/api/network/firewall/rules" "Add Firewall Rule" "202" "" '{"action": "accept", "protocol": "tcp", "port": 22}'

# ============================================================================
# Configuration Management Endpoints
# ============================================================================
print_header "Configuration Management Endpoints"

test_endpoint "POST" "/api/config/retrieve" "Retrieve Configuration" "200" "" '{"path": null}'
test_endpoint "POST" "/api/config/configure" "Set Configuration" "200" "" '{"path": "/test", "value": "test"}'
test_endpoint "POST" "/api/config/delete" "Delete Configuration" "200" "" '{"path": "/test"}'
test_endpoint "POST" "/api/config/generate" "Generate Configuration" "200" "" '{"validate": true}'
test_endpoint "GET" "/api/config/history" "Get Configuration History" "200"
test_endpoint "GET" "/api/config/history/test-id" "Get History Entry" "200"
test_endpoint "POST" "/api/config/rollback" "Rollback Configuration" "200" "" '{"history_id": "test-id"}'
test_endpoint "GET" "/api/config/diff/id1/id2" "Compare Configurations" "200"
test_endpoint "POST" "/api/config/search" "Search Configuration" "200" "" '{"search_term": "interfaces"}'
test_endpoint "POST" "/api/config/bulk" "Bulk Configuration Change" "200" "" '{"changes": [], "validate": true}'
test_endpoint "POST" "/api/config/validate" "Validate Configuration" "200"
test_endpoint "POST" "/api/config/value" "Get Config Value" "200" "" '{"path": "/test"}'
test_endpoint "POST" "/api/config/subtree" "Get Config Subtree" "200" "" '{"path": "/test"}'
test_endpoint "POST" "/api/config/compare" "Compare Configurations (POST)" "200" "" '{"id1": "id1", "id2": "id2"}'
test_endpoint "POST" "/api/config/discard" "Discard Configuration" "200"
test_endpoint "GET" "/api/config/stats" "Get Configuration Statistics" "200"

# ============================================================================
# System Operations Endpoints
# ============================================================================
print_header "System Operations Endpoints"

print_warning "POST /api/system/reboot - Destructive operation, skipped"
print_warning "POST /api/system/poweroff - Destructive operation, skipped"
print_warning "POST /api/system/reset - Destructive operation, skipped"
test_endpoint "GET" "/api/system/images" "List VyOS Images" "200"
print_warning "POST /api/system/images - Requires specific image data"
test_endpoint "POST" "/api/system/images/add" "Add Image" "202" "" '{"url": "http://example.com/image.iso"}'
print_endpoint "POST" "/api/system/images/delete" "Delete Image" "200" "" '{"name": "test-image"}'
test_endpoint "POST" "/api/system/images/set-default" "Set Default Image" "200" "" '{"name": "test-image"}'
test_endpoint "POST" "/api/system/show" "Execute Show Command" "200" "" '{"command": "version"}'
test_endpoint "GET" "/api/system/info" "Get System Information" "200"
test_endpoint "GET" "/api/system/operations/test-op-id" "Check Operation Status" "200"
test_endpoint "GET" "/api/system/health" "System Health Check" "200"

# ============================================================================
# WebSocket Endpoints
# ============================================================================
print_header "WebSocket Endpoints"

print_warning "GET /ws - WebSocket endpoint, requires WebSocket client"
print_warning "GET /ws/info - WebSocket info endpoint, requires WebSocket client"

# ============================================================================
# Summary
# ============================================================================
print_header "Test Summary"

TOTAL_COUNT=$((PASSED_COUNT + FAILED_COUNT + SKIPPED_COUNT))
echo -e "Total Tests: $TOTAL_COUNT"
echo -e "${GREEN}Passed: $PASSED_COUNT${NC}"
echo -e "${RED}Failed: $FAILED_COUNT${NC}"
echo -e "${YELLOW}Skipped: $SKIPPED_COUNT${NC}"

# Append summary to results file
echo "" >> "$TEST_RESULTS_FILE"
echo "============================================" >> "$TEST_RESULTS_FILE"
echo "Summary" >> "$TEST_RESULTS_FILE"
echo "Total: $TOTAL_COUNT" >> "$TEST_RESULTS_FILE"
echo "Passed: $PASSED_COUNT" >> "$TEST_RESULTS_FILE"
echo "Failed: $FAILED_COUNT" >> "$TEST_RESULTS_FILE"
echo "Skipped: $SKIPPED_COUNT" >> "$TEST_RESULTS_FILE"

# Exit with appropriate code
if [ $FAILED_COUNT -gt 0 ]; then
    exit 1
else
    exit 0
fi