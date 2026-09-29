import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8000/api/v1"

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    headers["Content-Type"] = "application/json"
    
    req_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            status_code = response.getcode()
            res_body = response.read().decode("utf-8")
            return status_code, json.loads(res_body) if res_body else None
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            parsed = json.loads(err_body)
        except Exception:
            parsed = err_body
        return e.code, parsed

def run_tests():
    print("==================================================")
    print("Testing Sprint D: Cheat Meal Tracker & Adaptive Balancer")
    print("==================================================")

    # 1. Login with test user
    login_payload = {
        "email": "test@example.com",
        "password": "Password123!"
    }
    code, res = make_request(f"{BASE_URL}/auth/login", method="POST", data=login_payload)
    if code != 200:
        reg_payload = {
            "email": "test@example.com",
            "password": "Password123!",
            "first_name": "Athlete",
            "last_name": "Test",
            "goal": "Build strength"
        }
        code, res = make_request(f"{BASE_URL}/auth/register", method="POST", data=reg_payload)
        code, res = make_request(f"{BASE_URL}/auth/login", method="POST", data=login_payload)

    assert code == 200, f"Login failed: {res}"
    token = res["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[OK] Auth Token Obtained")

    # 2. Test GET /cheat-meals/templates
    code, templates = make_request(f"{BASE_URL}/cheat-meals/templates", headers=headers)
    assert code == 200, f"Templates failed: {templates}"
    assert len(templates) >= 10, f"Expected at least 10 templates, got {len(templates)}"
    print(f"[OK] Retrieved {len(templates)} Popular Cheat Meal Templates ({templates[0]['name']})")

    # 3. Test POST /cheat-meals
    log_payload = {
        "name": "Pepperoni Pizza (3 Large Slices)",
        "meal_type": "Dinner",
        "estimated_calories": 920.0,
        "protein_g": 36.0,
        "carbs_g": 94.0,
        "fats_g": 44.0,
        "notes": "Celebration pizza with friends after hitting bench PR!",
        "feeling_tag": "Worth it 😋",
        "rebalance_days": 3,
        "rebalance_strategy": "balanced"
    }
    code, meal_data = make_request(f"{BASE_URL}/cheat-meals", method="POST", data=log_payload, headers=headers)
    assert code == 201, f"Log meal failed: {meal_data}"
    assert meal_data["name"] == "Pepperoni Pizza (3 Large Slices)"
    assert meal_data["active_plan"] is not None
    plan = meal_data["active_plan"]
    print(f"[OK] Logged Cheat Meal! Generated Adaptive Plan:")
    print(f"   - Surplus: +{plan['surplus_calories']} kcal over baseline")
    print(f"   - Window: {plan['rebalance_days']} days ({plan['strategy']} strategy)")
    print(f"   - Daily Calorie Offset: {plan['daily_calorie_offset']} kcal/day")
    print(f"   - Daily Extra Steps: +{plan['daily_extra_steps']} steps/day")
    print(f"   - Explanation: {plan['explanation']}")

    # 4. Test GET /cheat-meals/active-plan
    code, active_plan = make_request(f"{BASE_URL}/cheat-meals/active-plan", headers=headers)
    assert code == 200, f"Active plan failed: {active_plan}"
    assert active_plan is not None
    print("[OK] Active Rebalance Plan Retrieval Verified")

    # 5. Test GET /cheat-meals/overview
    code, ov_data = make_request(f"{BASE_URL}/cheat-meals/overview", headers=headers)
    assert code == 200, f"Overview failed: {ov_data}"
    assert ov_data["total_logged_all_time"] >= 1
    assert ov_data["current_active_plan"] is not None
    print(f"[OK] Overview telemetry: {ov_data['total_logged_all_time']} total logged, avg {ov_data['avg_calories_per_meal']} kcal")

    # 6. Test POST /cheat-meals/active-plan/{id}/complete
    code, comp_res = make_request(f"{BASE_URL}/cheat-meals/active-plan/{plan['id']}/complete", method="POST", headers=headers)
    assert code == 200, f"Complete plan failed: {comp_res}"
    print("[OK] Rebalance Plan Marked Completed")

    # 7. Test DELETE /cheat-meals/{id}
    code, del_res = make_request(f"{BASE_URL}/cheat-meals/{meal_data['id']}", method="DELETE", headers=headers)
    assert code == 204, f"Delete failed: {del_res}"
    print("[OK] Cheat Meal Cleanly Deleted")

    print("\n==================================================")
    print("ALL SPRINT D BACKEND TESTS PASSED (100% SUCCESS)")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
