# D.A.R.Y.L. Setup Instructions

(D)ata (A)nalysis (R)obot, makes (Y)our (L)ife easier.

This document provides a comprehensive guide for setting up and running the D.A.R.Y.L. application on your local machine. Follow these steps to get started.

## Prerequisites

1.  **Ensure Python 3 is Installed:** D.A.R.Y.L. requires Python 3 to run the local server. You can download and install it from the official Python website if you don't have it already.

2.  **Clone the Repository:** Download the project files to your local machine.

    ```
    git clone [your-repository-url]
    cd daryl
    ```

3.  **Install Python Dependencies:** The `server.py` script uses only standard Python libraries, so there are no external dependencies to install. However, for best practices, you can create a `requirements.txt` file (which will be empty) and install from it.

    ```
    # It's recommended to use a virtual environment
    python3 -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`

    # This command will install nothing, but is good practice
    pip install -r requirements.txt
    ```

## SSL Certificate Setup

The local server runs over HTTPS to avoid browser security restrictions. This requires a self-signed SSL certificate for the domain `daryl.local`. The server is configured to look for the certificate and key files in a `certs` directory inside your home folder.

### Easiest Method: Using `mkcert` (Recommended)

`mkcert` is a simple, cross-platform tool for creating locally trusted development certificates.

1.  **Install `mkcert`:**

      * **On macOS:** Use Homebrew.

        ```
        brew install mkcert nss
        ```

      * **On Windows:** Use Chocolatey.

        ```
        choco install mkcert
        ```

2.  **Install the Local CA:** This command adds `mkcert`'s root certificate to your system's trust store. You only need to run it once.

    ```
    mkcert -install
    ```

3.  **Generate the Certificate:** Navigate to your home directory, create the `certs` folder, and generate the certificate for `daryl.local`.

    ```
    cd ~
    mkdir certs
    cd certs
    mkcert daryl.local
    ```

4.  **Rename the Files:** The `server.py` script expects specific filenames.

    ```
    mv daryl.local.pem daryl.local.crt
    mv daryl.local-key.pem daryl.local.key
    ```

    You should now have `daryl.local.crt` and `daryl.local.key` in `~/certs/`.

## Host File Configuration for `daryl.local`

To make sure `https://daryl.local` resolves correctly to your local machine, you need to update your system's hosts file so that `daryl.local` points to `localhost` (`127.0.0.1`).

### macOS

1. **Open Terminal.**

2. **Create a backup of your current hosts file (optional but recommended):**

    ```bash
    sudo cp /etc/hosts /etc/hosts.backup
    ```

3. **Edit the hosts file:**

    ```bash
    sudo nano /etc/hosts
    ```

4. **Add the following line at the end of the file (or ensure it exists):**

    ```text
    127.0.0.1   daryl.local
    ```

    This tells your system that `daryl.local` should resolve to `localhost`.

5. **Save and exit `nano`:**

    - Press `Ctrl + O`, then `Enter` to save.
    - Press `Ctrl + X` to exit.

6. **(Optional) Flush DNS cache to apply changes immediately:**

    ```bash
    sudo dscacheutil -flushcache
    sudo killall -HUP mDNSResponder
    ```

7. **Test it:**

    Open your browser and try navigating to:

    ```text
    https://daryl.local:8001
    ```

    (Adjust the port if `server.py` uses a different one.)

### Windows

1. **Open Notepad as Administrator:**

    - Click the **Start** menu, type `Notepad`.
    - Right-click on **Notepad** and choose **Run as administrator**.

2. **Open the hosts file:**

    - In Notepad, go to **File > Open...**
    - Navigate to:

      ```text
      C:\Windows\System32\drivers\etc
      ```

    - In the bottom-right file type dropdown, select **All Files (*.*)**.
    - Select the `hosts` file and click **Open**.

3. **Add the following line at the end of the file:**

    ```text
    127.0.0.1   daryl.local
    ```

    This maps `daryl.local` to `localhost`.

4. **Save the file:**

    - Go to **File > Save**.
    - Close Notepad.

5. **(Optional) Flush DNS cache to apply changes immediately:**

    - Open **Command Prompt** as Administrator (Start menu → type `cmd` → right-click → **Run as administrator**).
    - Run:

      ```bat
      ipconfig /flushdns
      ```

6. **Test it:**

    Open your browser and go to:

    ```text
    https://daryl.local:8001
    ```

    (Again, adjust the port if needed.)

## Running the Application

Open a terminal in the project's root directory and run the command below. The server will start, and the application will automatically open in your default web browser.

  * **On macOS / Linux:**

    ```bash
    python3 server.py
    ```

  * **On Windows:**

    ```bat
    python server.py
    ```

> **Note:** The server will output the local URL in the terminal (e.g., `https://daryl.local:8001`). If your browser shows a security warning, it's because the certificate is self-signed. Since you created and trusted it yourself in the steps above, you can safely proceed.
