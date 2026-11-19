---
title: Claude in Rhino and CorelDRAW, Set Up by Alexandria Setup
date: 2026-11-19T17:00
area: Rhino and Grasshopper
version: '2.20'
---

The Rhino and Grasshopper packages in the office's shared folder are now 2.20. With automatic updates on, Rhino installs them the next time it starts; restart once more to load them, then click **Alexandria Setup**. [Install and Update](/docs/install/#updating) has the details.

### Claude Connectors

A connector lets Claude work in a program on your PC: draw in the open Rhino model, or edit the document open in CorelDRAW. **Alexandria Setup** now installs both and adds them to Claude, with nothing to do by hand.

- **A window opens the first time** and shows what it installs. Rhino carries on meanwhile. After that, a click on Setup only checks, which takes a second.
- **Rhino** gets McNeel's own Rhino-MCP-Platform package, from McNeel's server. It needs Rhino 8.19 or later.
- **CorelDRAW** gets its connector only on a PC that has CorelDRAW. Open your document first: Claude works in that one and never starts CorelDRAW by itself.
- **Claude Desktop and Claude Code** both get the two connectors, whichever your PC has. Quit Claude Desktop from its tray icon and open it again to see them.
- **Your Claude settings stay as they are.** Setup backs the settings file up before adding its two entries, and a connector you set up yourself is left alone.

[Claude Connectors](/docs/install/#claude-connectors) has the details, and how to take them out again.

### Without Rhino

A PC that only runs CorelDRAW installs the same thing from [All Downloads](/wiki/downloads/#claude-connectors): unzip **Claude connectors** and double-click **Install Claude Connectors**. It's on the office drive too, in `alexandria_packages`, as `claude_connectors`.

### Also in 2.20

- The docs, the quick guides and their printed PDFs in the shared folder are at 2.20.
