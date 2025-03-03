# cluster-smi for Visual Studio Code

[![CI: Test](https://github.com/k-kuroguro/vscode-cluster-smi/actions/workflows/test.yaml/badge.svg)](https://github.com/k-kuroguro/vscode-cluster-smi/actions/workflows/test.yaml)
[![CI: Code Quality](https://github.com/k-kuroguro/vscode-cluster-smi/actions/workflows/code-quality.yaml/badge.svg)](https://github.com/k-kuroguro/vscode-cluster-smi/actions/workflows/code-quality.yaml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Displays the output of [cluster-smi](https://github.com/PatWie/cluster-smi) as a tree view in your editor.

## Features

* Customizable display fields for both device and process information.
* Highlight available device.
* Filter nodes using regular expressions (via `cluster-smi`'s `-n` option).

![screenshot](https://raw.githubusercontent.com/k-kuroguro/vscode-cluster-smi/refs/heads/main/resources/tree-view-screenshot.png)

## Getting Started

1. Install the extension from [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=k-kuroguro.vscode-cluster-smi) or [Open VSX Registry](https://open-vsx.org/extension/k-kuroguro/vscode-cluster-smi).
2. After installation, a cluster-smi tree view will be added to the Explorer in the Activity Bar.

## Settings

### cluster-smi.execPath

Path to the cluster-smi executable.

### cluster-smi.deviceInfoFields

Control which device information fields are displayed in the tree view:

* **utilization**: GPU's utilization percentage [%]
* **memory**: GPU's memory usage and its percentage [MiB, %]
* **fanSpeed**: GPU's fan speed [%]
* **temperature**: GPU's temperature [°C]
* **powerUsage**: GPU's power consumption [W]
* **processes**: Running processes on GPU

### cluster-smi.processInfoFields

Control which process information fields are displayed in the tree view:

* **pid**: Process ID
* **usedGpuMemory**: Memory used by the process [MiB]
* **username**: Process owner
* **runtime**: How long the process has been running [d h m s]

### cluster-smi.nodeRegex

Regular expression to filter nodes. This is passed directly to `cluster-smi`'s `-n` option without escaping.
