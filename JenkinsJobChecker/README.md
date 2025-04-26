# Jenkins Job Checker

A browser extension that monitors Jenkins jobs for a specific user, showing finished and in-progress builds within a selected time frame. Supports both Chrome and Firefox.

## Features

- **Automatic Identity Fetch**: Retrieves the logged-in Jenkins user via `/whoAmI/api/json`.
- **Time Frame Filter**: Select jobs from the last 1, 2, 12, or 24 hours.
- **Sort Order**: Order results by start time (oldest→newest or newest→oldest).
- **Badge Notifications**: Displays a badge count for new finished jobs; clears when the popup is opened.
- **Full Page View**: Opens a larger interface to view many jobs at once.
- **Date Format**: Displays dates in D/M/YY format.

## Installation

### Chrome

1. **Download or Clone the Repository**
   ```bash
   git clone https://github.com/your-repo/jenkins-job-checker.git
   ```

2. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/` in your browser.

3. **Enable Developer Mode**
   - Toggle **Developer mode** on (top right).

4. **Load Unpacked Extension**
   - Click **Load unpacked**.
   - Select the folder containing the extension (the one with `manifest.json`).

5. **Verify Installation**
   - You should see **Jenkins Job Checker** in your list of extensions.
   - The extension icon (Jenkins logo) will appear in the toolbar.

### Firefox

1. **Download or Clone the Repository**
   ```bash
   git clone https://github.com/your-repo/jenkins-job-checker.git
   ```

2. **Open Debugging Page**
   - Navigate to `about:debugging#/runtime/this-firefox` in the address bar.

3. **Load Temporary Add-on**
   - Click **Load Temporary Add-on…**
   - Select the `manifest.json` file from the extension folder.

4. **Verify Installation**
   - **Jenkins Job Checker** will appear temporarily (until Firefox is restarted).
   - The extension icon will appear in the toolbar.

## Usage

1. **Open the Popup**
   - Click the extension icon in your browser toolbar.

2. **Configure Settings**
   - Enter your **Jenkins URL** (e.g., `https://jenkins.example.com`).
   - Select a **Time Frame** (hours).
   - Choose **Sort Order** (Oldest→Newest or Newest→Oldest).
   - Click **Save Settings** to store your preferences and fetch your Jenkins identity.

3. **Fetch Job Data**
   - Click **Fetch Jenkins Data**.
   - The popup will display:
     - **Job** name (bold, larger font).
     - **Link to job** (clickable).
     - **Status** (e.g., SUCCESS, IN-PROGRESS, FAILURE).
     - **Started at** and **Finished at** dates (D/M/YY).

4. **Full Page View**
   - Click **Open Full Page View** in the popup.
   - A new tab opens with a wider interface to view many jobs at once.

## Uninstall / Disable

- **Chrome**: Go to `chrome://extensions/`, find **Jenkins Job Checker**, and click **Remove** or toggle off.
- **Firefox**: Go to `about:addons`, find **Jenkins Job Checker**, and click **Remove**.

## Contributing

Feel free to submit issues or pull requests on GitHub. All contributions are welcome!

---
*Maintained by Kobi G.*

