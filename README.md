# daryl
(D)ata (A)nalysis (R)obot, makes (Y)our (L)ife easier.

# D.A.R.Y.L. Setup Instructions

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

## Running the Application

Open a terminal in the project's root directory and run the command below. The server will start, and the application will automatically open in your default web browser.

  * **On macOS / Linux:**

    ```
    python3 server.py
    ```

  * **On Windows:**

    ```
    python server.py
    ```

> **Note:** The server will output the local URL in the terminal (e.g., `https://daryl.local:8000`). If your browser shows a security warning, it's because the certificate is self-signed. Since you created and trusted it yourself in the steps above, you can safely proceed.
