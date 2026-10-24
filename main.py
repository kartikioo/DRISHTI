#!/usr/bin/env python3
"""
DRISHTI — Full-Stack Host Runner & VS Code Studio Integrator
Author: Kartik Pardeshi (kartikioo)

Runs backend and frontend servers with --host options, displays live network
host links, automatically launches the browser, and integrates with GitHub and VS Code.
"""

import os
import sys
import time
import socket
import signal
import subprocess
import webbrowser
from pathlib import Path

# ANSI Color Codes
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"

BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "backend-drishti"
FRONTEND_DIR = BASE_DIR / "frontend-drishti"

# Enhance PATH with common Node locations
NODE_PATHS = [
    Path.home() / ".nodejs" / "bin",
    Path.home() / ".nvm" / "versions" / "node",
    Path("/usr/local/bin"),
    Path("/opt/homebrew/bin"),
]
current_path = os.environ.get("PATH", "")
extra_paths = [str(p) for p in NODE_PATHS if p.exists() and str(p) not in current_path]
if extra_paths:
    os.environ["PATH"] = ":".join(extra_paths) + ":" + current_path

processes = []


def get_local_ip() -> str:
    """Detect LAN Wi-Fi / Ethernet IPv4 address."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def is_port_in_use(port: int) -> bool:
    """Check if a specific TCP port is already bound."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", port)) == 0


def print_banner(local_ip: str):
    """Print the high-visibility VS Code Host status banner."""
    sep = "=" * 66
    print(f"\n{CYAN}{BOLD}{sep}{RESET}")
    print(f"{CYAN}{BOLD}   👁️  DRISHTI — HOST RUNNER & VS CODE STUDIO INTEGRATION   {RESET}")
    print(f"{CYAN}{BOLD}{sep}{RESET}\n")

    print(f" {BOLD}🌐 ACTIVE HOST LINKS:{RESET}")
    print(f"   🏠 {GREEN}{BOLD}Localhost URL:{RESET}       {CYAN}http://localhost:5173/{RESET}")
    print(f"   📱 {GREEN}{BOLD}Network (LAN/Wi-Fi):{RESET} {CYAN}http://{local_ip}:5173/{RESET}")
    print(f"   ⚙️  {GREEN}{BOLD}Backend REST API:{RESET}   {CYAN}http://localhost:5001/{RESET}")
    print(f"   🩺 {GREEN}{BOLD}API Health Check:{RESET}   {CYAN}http://localhost:5001/api/health{RESET}\n")

    print(f" {BOLD}🐙 GITHUB & VS CODE INTEGRATION:{RESET}")
    print(f"   • Press {YELLOW}[g]{RESET} in this terminal to connect & push to GitHub.")
    print(f"   • Or open VS Code Source Control {DIM}(Ctrl+Shift+G / Cmd+Shift+G){RESET}")
    print(f"     and click {GREEN}'Publish to GitHub'{RESET} or {GREEN}'Sync Changes'{RESET}.\n")

    print(f" {BOLD}⚡ COMMAND CONTROLS:{RESET}")
    print(f"   • {YELLOW}[o]{RESET} Open in Web Browser   • {YELLOW}[g]{RESET} Connect / Push to GitHub")
    print(f"   • {YELLOW}[s]{RESET} Show Host Links       • {YELLOW}[q]{RESET} Stop & Exit")
    print(f"{CYAN}{BOLD}{sep}{RESET}\n")


def start_backend():
    """Start Node Express backend on port 5001 if not already running."""
    if is_port_in_use(5001):
        print(f" {GREEN}✓{RESET} Backend is already active on {CYAN}http://localhost:5001{RESET}")
        return None

    print(f" {YELLOW}⏳ Starting Backend API server on port 5001...{RESET}")
    proc = subprocess.Popen(
        ["node", "src/server.js"],
        cwd=str(BACKEND_DIR),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        env=os.environ
    )
    processes.append(proc)
    time.sleep(1.0)
    print(f" {GREEN}✓{RESET} Backend started successfully.")
    return proc


def start_frontend():
    """Start Vite frontend with --host 0.0.0.0 on port 5173 if not already running."""
    if is_port_in_use(5173):
        print(f" {GREEN}✓{RESET} Frontend is already active on {CYAN}http://localhost:5173{RESET}")
        return None

    print(f" {YELLOW}⏳ Starting Vite Frontend server with --host 0.0.0.0...{RESET}")
    proc = subprocess.Popen(
        ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"],
        cwd=str(FRONTEND_DIR),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        env=os.environ
    )
    processes.append(proc)
    time.sleep(1.2)
    print(f" {GREEN}✓{RESET} Frontend started successfully with Host mode enabled.")
    return proc


def setup_github_connection():
    """Interactive helper to link local Git repository to GitHub and push."""
    print(f"\n{CYAN}{BOLD}--- 🐙 Connect Drishti to GitHub ---{RESET}")
    try:
        res = subprocess.run(
            ["git", "remote", "-v"],
            cwd=str(BASE_DIR),
            capture_output=True,
            text=True
        )
        existing_remote = res.stdout.strip()

        if existing_remote:
            print(f"Current Git Remote:\n{GREEN}{existing_remote}{RESET}\n")
            push_now = input("Push latest commit to this remote now? (y/n): ").strip().lower()
            if push_now == "y":
                print(f" {YELLOW}⏳ Pushing to GitHub...{RESET}")
                push_res = subprocess.run(
                    ["git", "push", "-u", "origin", "main"],
                    cwd=str(BASE_DIR),
                    text=True
                )
                if push_res.returncode == 0:
                    print(f"{GREEN}{BOLD}✓ Successfully pushed to GitHub!{RESET}")
                else:
                    print(f"{RED}Push failed or requires credentials. Use VS Code Source Control UI to push directly.{RESET}")
            return

        print("No remote 'origin' found. Let's connect your GitHub repository!")
        print("Example: https://github.com/kartikioo/DRISHTI.git or git@github.com:kartikioo/DRISHTI.git\n")

        repo_url = input("Enter your GitHub repository URL (or press Enter to skip): ").strip()
        if not repo_url:
            print(f"{YELLOW}Skipped remote setup. You can also click 'Publish to GitHub' in VS Code sidebar.{RESET}")
            return

        subprocess.run(["git", "remote", "add", "origin", repo_url], cwd=str(BASE_DIR), check=True)
        print(f"{GREEN}✓ Remote 'origin' added: {repo_url}{RESET}")

        push_now = input("Push to 'main' branch now? (y/n): ").strip().lower()
        if push_now == "y":
            print(f" {YELLOW}⏳ Pushing to GitHub...{RESET}")
            push_res = subprocess.run(["git", "push", "-u", "origin", "main"], cwd=str(BASE_DIR))
            if push_res.returncode == 0:
                print(f"{GREEN}{BOLD}✓ Successfully pushed to GitHub!{RESET}")
            else:
                print(f"{YELLOW}Tip: You can use VS Code built-in Source Control tab (Ctrl+Shift+G) to authenticate and push with 1 click.{RESET}")

    except Exception as e:
        print(f"{RED}Error configuring GitHub: {e}{RESET}")


def cleanup(signum=None, frame=None):
    """Gracefully terminate background processes on exit."""
    print(f"\n{YELLOW}Stopping Drishti host processes...{RESET}")
    for proc in processes:
        if proc.poll() is None:
            try:
                proc.terminate()
                proc.wait(timeout=2)
            except Exception:
                proc.kill()
    print(f"{GREEN}All servers stopped cleanly. Goodbye!{RESET}")
    sys.exit(0)


def main():
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    if "--github" in sys.argv or "-g" in sys.argv:
        setup_github_connection()
        return

    local_ip = get_local_ip()

    if "--status" in sys.argv or "-s" in sys.argv:
        print_banner(local_ip)
        return

    start_backend()
    start_frontend()

    print_banner(local_ip)

    try:
        webbrowser.open("http://localhost:5173/")
    except Exception:
        pass

    while True:
        try:
            cmd = input(f"{CYAN}drishti-host > {RESET}").strip().lower()
            if cmd == "q" or cmd == "exit":
                break
            elif cmd == "o" or cmd == "open":
                webbrowser.open("http://localhost:5173/")
                print(f" {GREEN}✓{RESET} Opened http://localhost:5173/ in browser.")
            elif cmd == "s" or cmd == "status" or cmd == "host":
                print_banner(local_ip)
            elif cmd == "g" or cmd == "git" or cmd == "github":
                setup_github_connection()
            elif cmd == "help":
                print("Commands: [o] Open Browser | [g] GitHub Connect | [s] Show Host Links | [q] Quit")
            else:
                if cmd:
                    print(f"Unknown command: '{cmd}'. Press [s] to view links or [q] to quit.")
        except (KeyboardInterrupt, EOFError):
            break

    cleanup()


if __name__ == "__main__":
    main()
