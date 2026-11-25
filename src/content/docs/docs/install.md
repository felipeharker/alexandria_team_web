---
title: "Install and Update"
description: "Install the two Alexandria packages in Rhino 8, keep them updated, and fix what's missing."
---

<!-- Written by tools/sync.py from alexandria_phoenix/INSTALL.md. Edit it there and run the sync, not this page. -->

Two packages for Rhino 8 on Windows, installed from Rhino's Package Manager.

| Package | Adds |
|---|---|
| **Alexandria Rhino Tools** | The **Alexandria Tools** toolbar and the four `DM-…` display modes |
| **Alexandria Grasshopper Tools** | Grasshopper's **Alexandria Phoenix** tab |

## Install

1. Open the office's packages folder in File Explorer. If Windows asks, sign in and tick **Remember my credentials**.

   ```
   \\aria-design\Aria Projects\ARIA LLC\12_Aria_Architectural Design Standards Files\alexandria_packages
   ```

2. Double-click **Install Alexandria Tools**. Close Rhino when it asks.

It installs both packages in Rhino 8, sets Rhino to keep them up to date, then starts Rhino and runs **Alexandria Setup**. You now have:

- The **Alexandria Tools** tab, after **Standard**. Drag it anywhere; it stays there.
- The `DM-…` display modes in every viewport's display menu.
- The **Alexandria** template in *File > New*.
- The **Alexandria Phoenix** tab in Grasshopper.
- The [Claude connectors](#claude-connectors) for Rhino, CorelDRAW and SquareCoil. A window shows what it installs the first time, and asks for your SquareCoil login.

It needs no administrator rights. Run it again whenever something looks wrong: it only does what's missing.

## One Copy, from the Package Manager

The installer leaves exactly one copy of each package, the Package Manager's, whichever way the tools got onto the PC. It takes away:

| Found | Why it goes |
|---|---|
| The old **Alexandria Phoenix** package | Grasshopper finds every component twice |
| A dragged-in `Alexandria Rhino Tools.rhp` | Rhino loads that file instead of the package, and it never updates |
| A dragged-in Alexandria `.gha` in Grasshopper's Libraries folder | Components twice, never updated |
| The old drag-in toolbar, `alexandria_tools.rui` | Replaced by the package's toolbar tab |

Nothing is deleted: files go to `%USERPROFILE%\.alexandria\rhino_tools\backup`, with the log, `install.log`, beside it. A package installed for all users, in `ProgramData`, needs an administrator to uninstall; the installer says so.

## Updating

Rhino updates the packages itself. About 10 seconds after it starts, it installs a newer release from the packages folder; the next start loads it. Your version is on the Package Manager's **Installed** tab.

- **After an update,** click **Alexandria Setup** once if a button or display mode changed. Close other Rhino windows first: the last one closed decides how the toolbar opens next.
- **Every package updates this way,** not only Alexandria's: that's the Package Manager's *Automatically update packages when Rhino starts*, on unless someone unticked it. The installer ticks it again.
- **Off the office drive,** Rhino can't see the folder, so the update waits until you're back.

Coming from 1.6 or earlier, type `AlexandriaSetup` once to bring the toolbar back as a tab. A definition that reports "Input parameter chunk is missing" needs saving once more.

## Installing by Hand

If the installer can't run:

1. In Rhino, open **Tools › Options › Advanced**, search for `PackageManager.Sources`, and set it to:

   ```
   https://yak.rhino3d.com;\\aria-design\Aria Projects\ARIA LLC\12_Aria_Architectural Design Standards Files\alexandria_packages
   ```

   If the old value listed anything besides `https://yak.rhino3d.com`, add it at the end after another `;`.
2. Run `PackageManager`, search for `Alexandria` and install **Alexandria Rhino Tools** and **Alexandria Grasshopper Tools**. In the Package Manager, uninstall **Alexandria Phoenix** if it's there.
3. Tick **Automatically update packages when Rhino starts**, restart Rhino and type `AlexandriaSetup`.

## Uninstalling

In the Package Manager's **Installed** tab, select the package, click **Uninstall** and restart Rhino. To remove the display modes too, delete them in **Tools › Options › View › Display Modes**.

## If Something's Missing

- **Anything at all.** Double-click **Install Alexandria Tools** again: it finds what's missing or doubled and puts it right.
- **The installer can't find the packages.** Open the folder in File Explorer first, and sign in if Windows asks.
- **The toolbar doesn't appear.** Type `AlexandriaSetup`. If it's still hidden, run `Toolbar`, pick the **Alexandria Tools** file and tick **Alexandria Tools**.
- **The toolbar moved back.** Dock it in the Rhino window you close last.
- **The right-hand panels look different.** Right click **Alexandria Setup**. Panels it closes reopen from **Panels** in the menu.
- **An `Alexandria…` command is unknown.** Run the installer, then restart Rhino.

## Claude Connectors

A connector lets Claude work in a program or system: the open Rhino model, the open CorelDRAW document, or Aria's design requests in SquareCoil. **Alexandria Setup** installs them for Claude Desktop and Claude Code. **Install Connectors**, beside it on the toolbar, lists them with where each stands, so you can pick which to install or update, or click **Install / Update All**.

| Connector | In Claude it's | Installs |
|---|---|---|
| Rhino | `rhino-mcp-platform` | McNeel's **Rhino-MCP-Platform** package. Needs Rhino 8.19 or later |
| CorelDRAW | `coreldraw-live` | A CorelDRAW server, about 150 MB. Only on a PC with CorelDRAW |
| SquareCoil | `squarecoil` | A small server that reads the design request lists (In Progress, Next Job, On Hold), read-only. Asks for your own SquareCoil login once |

- **After the first setup,** quit Claude Desktop from its tray icon and open it again, and restart Rhino. They show under **Settings › Developer**.
- **Rhino.** Ask Claude to work in Rhino. It opens one if none is running.
- **CorelDRAW.** Open the document first. Claude never starts CorelDRAW by itself.
- **SquareCoil.** Ask Claude what's due, what's assigned to someone, or what's overdue. Everyone signs in with their own SquareCoil login, which goes to Windows Credential Manager, never a file. Leave the username empty to skip it; **Install Connectors** asks again. If your SquareCoil password changes, run `python squarecoil.py login` in `%USERPROFILE%\.alexandria\claude_connectors\squarecoil`.
- **No Rhino on the PC?** Double-click **Install Claude Connectors** in the `claude_connectors` folder of `alexandria_packages`, or get it from the hub's Downloads page.
- **Your Claude settings are safe.** Setup backs the settings file up and leaves connectors you set up yourself alone.
- **Something went wrong?** See `install.log` in `%USERPROFILE%\.alexandria\claude_connectors`.
- **To remove them,** open PowerShell in the `claude_connectors` folder and run `powershell -ExecutionPolicy Bypass -File install.ps1 -Uninstall`. It takes the SquareCoil login out of Credential Manager too.

## Claude in Rhino

Optional: a chat panel in Rhino where Claude works in the open model. It needs Rhino 8.19 or later and a paid Claude plan. Each person signs in with their own account.

1. **Check the panel.** Alexandria Setup has installed it. If `AIPanel` is unknown after a restart, run `PackageManager` and install `Rhino-MCP-Platform`.
2. **Install Claude Code.** Open PowerShell and run:

   ```powershell
   irm https://claude.ai/install.ps1 | iex
   ```

   It lands in `%USERPROFILE%\.local\bin`, where the panel looks for it. The copy inside the Claude desktop app doesn't count.
3. **Restart Rhino.**
4. **Sign in.** Type `AIPanel`, then `/login` in its chat box, and sign in on the page that opens.
5. **Set it up.** Type `/settings` in the panel:
   - **AI Agents:** select **Claude** and paste the prompt below into **Prompt**.
   - **Tools:** untick `close_doc`, which closes the model without saving.
   - Click **Save**.

The prompt:

```
You're working inside Rhino 8 on sign design projects, with Alexandria Rhino Tools installed.

- Do what's asked and stop. No renders, layouts, exports or extra options unless asked.
- Use the Alexandria commands where they fit instead of rebuilding by hand (get_commands with filter "Alexandria" lists them): Populate Model, Set Material, Set Light, Populate Detail, Dimension, Leader, Day/Night Render.
- Models are full size in inches, the sign at the origin facing -Y. Parts go on DESIGN sublayers, lit faces on DESIGN::ILLUMS, dimensions on DETAILS::ANNOTATIONS::DIMENSIONS, callouts on DETAILS::ANNOTATIONS::CALLOUTS.
- If the model is saved in a project's models folder (`design_models`), read the project's BRIEF.md and .claude/CLAUDE.md (one folder up) before starting. The full spec is STANDARDS.md in the shared alexandria_packages folder; read only the part the task touches.
- Don't save, close or overwrite files, or delete objects, unless asked.
- Keep replies short.
```

If it doesn't work:

- **`AIPanel` is an unknown command.** Install the package and restart Rhino. If Rhino can't load it, update Rhino 8 (**Help › Check for Updates**) and run `SetDotNetRuntime` to check it's on .NET 8 (*NETCore*).
- **"Claude CLI not found. Install Claude Code."** Do step 2, then restart Rhino.
- **Claude needs sign-in.** Type `/login` in the panel again.
- **"No agent available."** In `/settings`, select **Claude** and tick **Enabled**.

## With a Copy of This Repo

Add your clone's `dist` folder to the sources instead of the shared folder. Updates then arrive only when you pull.
