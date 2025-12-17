#!/usr/bin/env python3
from http.server import HTTPServer, SimpleHTTPRequestHandler
from functools import partial
import ssl
import os
import webbrowser
import logging
from datetime import datetime
import json
import re
import urllib.parse

HOST = "daryl.local"
PORT = 8000
CERTFILE = os.path.expanduser("~/certs/daryl.local.crt")
KEYFILE  = os.path.expanduser("~/certs/daryl.local.key")
SERVE_DIR = os.getcwd()

# --- Setup Directories ---
LOG_DIR = os.path.join(SERVE_DIR, "logs")
PROMPTS_DIR = os.path.join(SERVE_DIR, "assets", "prompts")
os.makedirs(LOG_DIR, exist_ok=True)
os.makedirs(PROMPTS_DIR, exist_ok=True)

log_filename = datetime.now().strftime("%Y-%m-%d-app-log.txt")
log_filepath = os.path.join(LOG_DIR, log_filename)

logging.basicConfig(
    filename=log_filepath,
    filemode="a",
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    level=logging.INFO,
)

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path

        if path == "/list-prompts":
            self.handle_list_prompts()
        elif path == "/check-prompt-exists":
            self.handle_check_prompt_exists()
        else:
            # Fallback to serving static files
            super().do_GET()

    def do_POST(self):
        path = self.path
        if path == "/save-prompt":
            self.handle_save_prompt()
        elif path == "/delete-prompt":
            self.handle_delete_prompt()
        else:
            self.send_error(404, "Endpoint not found")

    def handle_list_prompts(self):
        try:
            prompts = [f for f in os.listdir(PROMPTS_DIR) if f.endswith('.json')]
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(prompts).encode('utf-8'))
        except Exception as e:
            self.send_error(500, f"Error listing prompts: {e}")

    def handle_check_prompt_exists(self):
        query_components = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        filename = query_components.get("filename", [None])[0]
        if not filename:
            self.send_error(400, "Filename parameter is missing")
            return

        exists = os.path.exists(os.path.join(PROMPTS_DIR, filename))
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"exists": exists}).encode('utf-8'))

    def handle_save_prompt(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            filename = data.get("filename")
            content = data.get("content")

            if not filename or not content:
                self.send_error(400, "Missing filename or content")
                return

            # Security: Sanitize filename to prevent path traversal
            safe_filename = re.sub(r'[^a-zA-Z0-9_.-]', '', os.path.basename(filename))
            if not safe_filename.endswith('.json'):
                self.send_error(400, "Filename must end with .json")
                return

            filepath = os.path.join(PROMPTS_DIR, safe_filename)
            with open(filepath, 'w') as f:
                json.dump(content, f, indent=4)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "message": "Prompt saved successfully."}).encode('utf-8'))
        except Exception as e:
            self.send_error(500, f"Error saving prompt: {e}")
            
    def handle_delete_prompt(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            filename = data.get("filename")
            if not filename:
                self.send_error(400, "Missing filename")
                return

            safe_filename = re.sub(r'[^a-zA-Z0-9_.-]', '', os.path.basename(filename))
            filepath = os.path.join(PROMPTS_DIR, safe_filename)

            if os.path.exists(filepath):
                os.remove(filepath)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "message": "Prompt deleted."}).encode('utf-8'))
            else:
                self.send_error(404, "File not found")
        except Exception as e:
            self.send_error(500, f"Error deleting prompt: {e}")


    def log_message(self, format, *args):
        logging.info("%s - %s" % (self.client_address[0], format % args))

if __name__ == "__main__":
    Handler = partial(CORSRequestHandler, directory=SERVE_DIR)
    httpd = HTTPServer((HOST, PORT), Handler)

    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(certfile=CERTFILE, keyfile=KEYFILE)
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

    url = f"https://{HOST}:{PORT}"
    print(f"Serving {SERVE_DIR} at {url}")
    print(f"Logging to {log_filepath}")
    print(f"Prompts directory is {PROMPTS_DIR}")

    webbrowser.open_new_tab(url)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down…")
        httpd.server_close()
        logging.info("Server shutdown.")

