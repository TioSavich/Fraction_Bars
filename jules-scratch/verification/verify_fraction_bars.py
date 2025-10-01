from playwright.sync_api import sync_playwright, expect
import os

def run_verification(page):
    # Get the absolute path to the HTML file
    file_path = os.path.abspath("Fraction_Bars.html")
    page.goto(f"file://{file_path}")

    # 1. Test creating a bar
    page.locator("#tool_bar").click()
    canvas = page.locator("#fbCanvas")
    canvas.hover()
    page.mouse.down()
    page.mouse.move(200, 200)
    page.mouse.up()

    # 2. Test opening and closing the "split" dialog
    page.locator("#window_split").click()
    split_dialog = page.locator("#dialog-splits")
    expect(split_dialog).to_be_visible()
    page.locator("#split-ok-button").click()
    expect(split_dialog).not_to_be_visible()

    # 3. Test opening and closing the "properties" dialog
    page.locator("#window_properties").click()
    properties_dialog = page.locator("#dialog-properties")
    expect(properties_dialog).to_be_visible()
    properties_dialog.locator("button[value='ok']").click()
    expect(properties_dialog).not_to_be_visible()

    # 4. Test opening and closing the "iterate" dialog
    page.locator("#window_iterate").click()
    iterate_dialog = page.locator("#dialog-iterate")
    expect(iterate_dialog).to_be_visible()
    iterate_dialog.locator("button[value='ok']").click()
    expect(iterate_dialog).not_to_be_visible()

    # 5. Test opening and closing the "make" dialog
    page.locator("#action_make").click()
    make_dialog = page.locator("#dialog-make")
    expect(make_dialog).to_be_visible()
    make_dialog.locator("button[value='cancel']").click()
    expect(make_dialog).not_to_be_visible()

    # Take a screenshot for visual confirmation
    page.screenshot(path="jules-scratch/verification/verification.png")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    run_verification(page)
    browser.close()

print("Verification script executed successfully.")