#!/usr/bin/env python3
            # LOONAR System Monitor & Automation Orchestrator
            import sys
            import os
            import platform
            import time

            def audit_system_environment():
                print("="*60)
                print("           LOONAR V1.0 SYSTEM HARDWARE AUDIT           ")
                print("="*60)
                print(f" [*] Operating System:   {platform.system()} {platform.release()}")
                print(f" [*] Core Architecture:  {platform.machine()}")
                print(f" [*] Python Executable:  {sys.executable}")
                print(f" [*] Active Directory:   {os.getcwd()}")
                
                # Check for key developer binaries
                compilers = {
                    "gcc": "C compiler",
                    "nasm": "Assembly compiler",
                    "git": "Version control",
                    "node": "JavaScript engine",
                    "tsc": "TypeScript compiler"
                }
                
                print("-"*60)
                print(" [*] Software Tools Presence Check:")
                import shutil
                for cmd, desc in compilers.items():
                    path = shutil.which(cmd)
                    status = f"FOUND ({path})" if path else "MISSING"
                    print(f"     - {cmd.ljust(6)} ({desc}): {status}")
                print("="*60)

            if __name__ == "__main__":
                audit_system_environment()