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

They install from the office's packages folder, so you need the office drive:

```
\\aria-design\Aria Projects\ARIA LLC\12_Aria_Architectural Design Standards Files\alexandria_packages
```

## 1. Add the Alexandria Folder to the Package Manager

Once per computer.

1. Open the folder above in File Explorer to check you can reach it. If Windows asks, sign in and tick **Remember my credentials**.
2. In Rhino, open **Tools › Options › Advanced** and search for `PackageManager.Sources`.
3. Double-click the value and replace all of it with:

   ```
   https://yak.rhino3d.com;\\aria-design\Aria Projects\ARIA LLC\12_Aria_Architectural Design Standards Files\alexandria_packages
   ```

   If the old value listed anything besides `https://yak.rhino3d.com`, add it at the end after another `;`.
4. Click **OK**.

## 2. Install the Packages

1. Run `PackageManager` and search for `Alexandria`.
2. Install **Alexandria Rhino Tools** and **Alexandria Grasshopper Tools**.
3. Tick **Automatically update packages when Rhino starts**.
4. Close every Rhino window and start Rhino again.

## 3. Run Alexandria Setup

Type `AlexandriaSetup` and press Enter. Once, after installing.

You now have:

- The **Alexandria Tools** tab, after **Standard**. Drag it anywhere; it stays there.
- The `DM-…` display modes in every viewport's display menu.
- The **Alexandria** template in *File > New*.
- The **Alexandria Phoenix** tab in Grasshopper.
- The [Claude connectors](#claude-connectors) for Rhino and CorelDRAW. A window shows what it installs the first time.

## The Buttons

The quick guide shows how to use each one. The render buttons need V-Ray for Rhino.

| Button | Command | Does |
|---|---|---|
| Alexandria Setup | `AlexandriaSetup`, right click `AlexandriaSetPanels` | Adds the tab, the display modes, the template and the Claude connectors. Right click arranges the right-hand panels |
| Create Project | `AlexandriaCreateProject` | Copies the project template to a folder you pick and saves the model there as `<project>_model_v1.3dm` |
| Populate Model | `AlexandriaPopulateModel` | Sets inches and tolerances, and adds the standard layers, annotation styles, wall, ground, scale figure and world light |
| Set Material | `AlexandriaSetMaterial` | Gives each sublayer of a layer a plaster material in its colour |
| Set Light | `AlexandriaSetLight` | Makes the selected surfaces or solids a standard V-Ray light, on `DESIGN::ILLUMS` |
| Apply Day Settings | `AlexandriaDayRender`, right click `AlexandriaDayRenderView` | Sets V-Ray to the day sky, sign lights off. Right click renders the active view and saves it |
| Apply Night Settings | `AlexandriaNightRender`, right click `AlexandriaNightRenderView` | Sets V-Ray to the night sky, sign lights on. Right click renders and saves |
| Standard Dimension | `AlexandriaDimension`, right click `AlexandriaLeader` | A dimension in the Alexandria style. Right click draws a leader with a dot |
| Populate Detail | `AlexandriaPopulateDetail` | Adds a sign detail from the library where you click |
| Layout Manager | `AlexandriaLayoutManager` | The design package: pages, details, drawings, CMF, images and the PDF |
| Fabrication Manager | `AlexandriaFabricationManager` | The 1:1 cut linework by material and line type, and a DXF per material |
| Save as Rhino 7 | `AlexandriaSaveAsR7` | Saves a Rhino 7 copy beside the model as `<name>_r7.3dm` |
| Save as Rhino 8 | `AlexandriaSaveAsR8` | Saves a Rhino 8 copy beside the model as `<name>_r8.3dm` |

The drawing standard behind them is in [STANDARDS.md](/docs/standards/#drawings).

## Updating

- **With automatic updates on,** Rhino installs a new version as it starts. Restart once more to load it.
- **Without them,** run `PackageManager`, open **Updates**, click **Update** on each Alexandria package and restart Rhino.
- **After any update,** click **Alexandria Setup** once. Close other Rhino windows first: the last one closed decides how the toolbar opens next.

Your version is on the Package Manager's **Installed** tab.

Coming from 1.6 or earlier, type `AlexandriaSetup` once to bring the toolbar back as a tab. A definition that reports "Input parameter chunk is missing" needs saving once more.

## Moving from the Old Install

For a computer that still has the old **Alexandria Phoenix** package and the dragged-in toolbar.

1. In the Package Manager's **Installed** tab, uninstall **Alexandria Phoenix**. Otherwise Grasshopper finds every component twice.
2. Install both packages as above and restart Rhino.
3. Click **Alexandria Setup**.

## Uninstalling

In the Package Manager's **Installed** tab, select the package, click **Uninstall** and restart Rhino. To remove the display modes too, delete them in **Tools › Options › View › Display Modes**.

## If Something's Missing

- **The packages don't show up in the search.** Check that File Explorer opens the folder, and that the sources value matches step 1 exactly.
- **The toolbar doesn't appear.** Type `AlexandriaSetup`. If it's still hidden, run `Toolbar`, pick the **Alexandria Tools** file and tick **Alexandria Tools**.
- **The toolbar moved back.** Dock it in the Rhino window you close last.
- **The right-hand panels look different.** Right click **Alexandria Setup**. Panels it closes reopen from **Panels** in the menu.
- **An `Alexandria…` command is unknown.** Install Alexandria Rhino Tools, then restart Rhino.

## Claude Connectors

A connector lets Claude work in a program on your PC: the open Rhino model, or the open CorelDRAW document. **Alexandria Setup** installs both, for Claude Desktop and Claude Code, with nothing to do by hand.

| Connector | In Claude it's | Installs |
|---|---|---|
| Rhino | `rhino-mcp-platform` | McNeel's **Rhino-MCP-Platform** package. Needs Rhino 8.19 or later |
| CorelDRAW | `coreldraw-live` | A CorelDRAW server, about 150 MB. Only on a PC with CorelDRAW |

- **After the first setup,** quit Claude Desktop from its tray icon and open it again, and restart Rhino. The two show under **Settings › Developer**.
- **Rhino.** Ask Claude to work in Rhino. It opens one if none is running.
- **CorelDRAW.** Open the document first. Claude never starts CorelDRAW by itself.
- **No Rhino on the PC?** Double-click **Install Claude Connectors** in the `claude_connectors` folder of `alexandria_packages`, or get it from the hub's Downloads page.
- **Your Claude settings are safe.** Setup backs the settings file up and leaves connectors you set up yourself alone.
- **Something went wrong?** See `install.log` in `%USERPROFILE%\.alexandria\claude_connectors`.
- **To remove them,** open PowerShell in the `claude_connectors` folder and run `powershell -ExecutionPolicy Bypass -File install.ps1 -Uninstall`.

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
- Use the Alexandria commands where they fit instead of rebuilding by hand (get_commands with filter "Alexandria" lists them): Populate Model, Set Material, Set Light, Populate Detail, Dimension, Leader, Layout Manager, Fabrication Manager, Day/Night Render.
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
