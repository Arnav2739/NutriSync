"""
Automated Test Suite for Remaining Modules Implementation using urllib:
1. Module 6.2: Personalized Workout Recommendation Engine
2. Module 6.8 & 6.1: Body Weight & Biometric Progression Logger
3. Module 6.1: Goal & Profile Partial Updates
"""
import urllib.request
import urllib.error
import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000/api/v1"

def http_req(endpoint, method="GET", data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err_content = e.read().decode("utf-8")
        return e.code, err_content

def run_tests():
    print("═══ TESTING NUTRISYNC REMAINING MODULES ═══\n")

    # 1. Login or Register test user
    email = "athlete_pro@nutrisync.com"
    pwd = "Password123!"
    print(f"1. Authenticating user ({email})...")
    code, res = http_req("/auth/login", method="POST", data={"email": email, "password": pwd})
    if code != 200:
        # Register
        code, res = http_req("/auth/register", method="POST", data={"email": email, "password": pwd, "first_name": "Pro", "last_name": "Athlete", "goal": "Muscle Hypertrophy"})
        if code in (200, 201):
            login_code, login_res = http_req("/auth/login", method="POST", data={"email": email, "password": pwd})
            token = login_res["access_token"]
        else:
            print(f"❌ Auth failed: {code} {res}")
            sys.exit(1)
    else:
        token = res["access_token"]

    print("✅ Authenticated successfully.")

    # Ensure profile exists
    p_code, p_res = http_req("/profile/me", token=token)
    if p_code != 200:
        profile_data = {
            "age": 28,
            "gender": "Female",
            "height_cm": 170.0,
            "weight_kg": 68.0,
            "target_weight_kg": 62.0,
            "dietary_preference": "High-Protein Athlete",
            "primary_goal": "Muscle Hypertrophy",
            "activity_level": "Moderately Active"
        }
        http_req("/profile", method="POST", data=profile_data, token=token)
        print("✅ Baseline profile calibrated.")


    # 2. Test Workout Splits & Personalized Recommendations (§6.2)
    print("2. Testing Workout Recommendation Splits (GET /workouts/recommendations/splits)...")
    code, splits = http_req("/workouts/recommendations/splits", token=token)
    assert code == 200, f"Failed: {splits}"
    print(f"✅ Found {len(splits)} available splits: {[s['split_key'] for s in splits]}")

    print("3. Testing Auto Daily Routine Recommendation (GET /workouts/recommendations?split=auto)...")
    code, rec_data = http_req("/workouts/recommendations?split=auto", token=token)
    assert code == 200, f"Failed: {rec_data}"
    print(f"✅ Recommended: '{rec_data['routine_title']}' ({rec_data['goal_alignment_badge']})")
    print(f"   Duration: {rec_data['estimated_duration_min']} min | Est Burn: {rec_data['estimated_calories_burned']} kcal")
    print(f"   Exercises ({len(rec_data['exercises'])}):")
    for ex in rec_data["exercises"]:
        print(f"   • {ex['name']} ({ex['primary_muscle']}): {ex['target_sets']} sets x {ex['target_reps_label']} @ {ex['suggested_weight_kg']}kg (Rest {ex['target_rest_seconds']}s)")

    print("\n4. Testing Explicit Split (GET /workouts/recommendations?split=legs)...")
    code, legs_data = http_req("/workouts/recommendations?split=legs", token=token)
    assert code == 200
    print(f"✅ Generated Legs Split with {len(legs_data['exercises'])} exercises.")

    # 3. Test Biometric Progress Tracking (§6.8 & §6.1)
    print("\n5. Testing Biometrics Overview (GET /progress/biometrics)...")
    code, bio_data = http_req("/progress/biometrics", token=token)
    assert code == 200, f"Failed: {bio_data}"
    print(f"✅ Baseline: Start {bio_data['starting_weight_kg']}kg, Current {bio_data['current_weight_kg']}kg, Target {bio_data['target_weight_kg']}kg")
    print(f"   BMI: {bio_data['current_bmi']} ({bio_data['current_bmi_category']}) | Progress: {bio_data['progress_pct']}%")

    print("\n6. Logging New Biometric Weigh-In (POST /progress/biometrics)...")
    new_weighin = {
        "weight_kg": 64.2,
        "body_fat_pct": 19.5,
        "waist_cm": 68.0,
        "chest_cm": 88.0,
        "arms_cm": 28.5,
        "notes": "Morning weigh-in; feeling energized"
    }
    code, created_log = http_req("/progress/biometrics", method="POST", data=new_weighin, token=token)
    assert code == 201, f"Failed: {created_log}"
    print(f"✅ Created Biometric Log ID: {created_log['id']} with weight {created_log['weight_kg']}kg")

    print("\n7. Re-checking Biometrics Overview after log...")
    code, bio_data2 = http_req("/progress/biometrics", token=token)
    assert code == 200
    print(f"✅ Updated Current Weight: {bio_data2['current_weight_kg']}kg (Total logs: {bio_data2['total_logs_count']})")
    print(f"   Trajectory points: {len(bio_data2['trajectory_points'])}")

    # 4. Test Profile Partial Update (§6.1)
    print("\n8. Testing Profile Partial Update (PUT /profile)...")
    update_data = {
        "target_weight_kg": 60.0,
        "primary_goal": "Muscle Hypertrophy"
    }
    code, updated_profile = http_req("/profile", method="PUT", data=update_data, token=token)
    assert code == 200, f"Failed: {updated_profile}"
    print(f"✅ Updated Profile Target Weight: {updated_profile['target_weight_kg']}kg, Goal: {updated_profile['primary_goal']}")

    print("\n🎉 ALL REMAINING MODULE TESTS PASSED 100%!")

if __name__ == "__main__":
    run_tests()
