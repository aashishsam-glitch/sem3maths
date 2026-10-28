#!/usr/bin/env bash
echo "==============================================================================="
echo "  Starting System Bottleneck Identification Using Correlation & Rank Correlation"
echo "==============================================================================="
echo ""

if ! command -v python3 &> /dev/null
then
    echo "[ERROR] Python3 could not be found. Please install Python 3.10+."
    exit 1
fi

python3 run_app.py
