#!/usr/bin/env python3
"""CLI compatível com automações Python; reutiliza o motor único JS via Node 22+.

Uso: python3 main.py presets/rio-exemplo.json > resultado.json
     cat cenario.json | python3 main.py -
Não há motor financeiro duplicado em Python. A exigência de Node é deliberada
e documentada em docs/adr-001-arquitetura.md.
"""
import argparse
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parent

def main() -> int:
    parser = argparse.ArgumentParser(description="Simulador comprar ou alugar")
    parser.add_argument("input", nargs="?", default="-", help="JSON de entrada; '-' para stdin")
    args = parser.parse_args()
    node = shutil.which("node")
    if not node:
        print("Erro: Node.js 22+ é necessário para executar o motor canônico.", file=sys.stderr)
        return 2
    command = [node, str(ROOT / "cli.mjs")]
    if args.input != "-":
        command.append(args.input)
    return subprocess.run(command, check=False).returncode

if __name__ == "__main__":
    raise SystemExit(main())
