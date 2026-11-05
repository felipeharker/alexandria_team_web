---
title: "Install and Update"
description: "Install the two Alexandria packages in Rhino 8, keep them updated, and fix what's missing."
---

<!-- Written by tools/sync.py from alexandria_phoenix/INSTALL.md. Edit it there and run the sync, not this page. -->

Alexandria comes as two packages for Rhino 8 on Windows, both installed from Rhino's Package Manager:

| Package | Adds |
|---|---|
| **Alexandria Rhino Tools** | The **Alexandria Tools** toolbar, its commands and the four `DM-…` display modes |
| **Alexandria Grasshopper Tools** | The components on Grasshopper's **Alexandria Phoenix** tab |

The packages live in the office's Alexandria packages folder, `\\aria-design\Aria Projects\ARIA LLC\12_Aria_Architectural Design Standards Files\alexandria_packages`, not on McNeel's public server, so only people who can open that folder can install them. On a machine with the office drive mapped as X:, it's `X:\ARIA LLC\12_Aria_Architectural Design Standards Files\alexandria_packages`; either path works, but the full one doesn't depend on the drive letter. Install one package or both. Alexandria annotations use the Oswald font, which every office machine already has.

Alexandria needs Rhino 8.

## 1. Add the Alexandria Folder to the Package Manager

Once per computer.

1. Open `\\aria-design\Aria Projects\ARIA LLC\12_Aria_Architectural Design Standards Files\alexandria_packages` in File Explorer to check you can reach it. If Windows asks you to sign in, sign in and tick **Remember my credentials**.
2. In Rhino, open **Tools › Options › Advanced** and type `PackageManager.Sources` in the search box.
3. Double-click the value of `Rhino.Options.PackageManager.Sources`, select all of it, and paste this in its place:

   ```
   https://yak.rhino3d.com;\\aria-design\Aria Projects\ARIA LLC\12_Aria_Architectural Design Standards Files\alexandria_packages
   ```

   That's McNeel's server, which Rhino uses by default, followed by the Alexandria folder. If the old value listed anything besides `https://yak.rhino3d.com`, add it back at the end, after another `;`.
4. Click **OK**.

## 2. Install the Packages

1. Run `PackageManager` (**Tools › Package Manager**).
2. Search for `Alexandria`. Both packages appear.
3. Select **Alexandria Rhino Tools** and click **Install**. Do the same for **Alexandria Grasshopper Tools**.
4. Tick **Automatically update packages when Rhino starts** at the bottom of the window, so updates arrive by themselves.
5. Close every Rhino window and start Rhino again.

## 3. Run Alexandria Setup

Once, after installing.

Type `AlexandriaSetup` and press Enter. It adds **Alexandria Tools** as a tab of Rhino's toolbars, right after **Standard**, imports the display modes, and closes any older Alexandria toolbar. Drag the tab anywhere along the strip; it stays there through updates.

`DM-WORKING`, `DM-AUTOCAD`, `DM-DIAGRAM` and `DM-DIAGRAM-SHADOW` are now in every viewport's display menu, and running `Grasshopper` shows the **Alexandria Phoenix** tab.

| Button | Command | Does |
|---|---|---|
| Alexandria Setup | `AlexandriaSetup`, right click `AlexandriaSetPanels` | Adds this tab and installs the display modes. Right click, *Set Panels*: arranges Rhino's right-hand panels to the standard |
| Create Project | `AlexandriaCreateProject` | Asks for a project name, then a folder. Copies the project template there and saves the open model in its models folder (`design_models`) as `<project>_model_v1.3dm` |
| Populate Model | `AlexandriaPopulateModel` | Sets an empty model to inches and the standard tolerances, and adds the standard layers, the annotation styles, the render backdrop (wall, modeled ground, scale figure) and the world light |
| Set Material | `AlexandriaSetMaterial` | Gives each sublayer of a layer you choose a plaster material in its display colour, `MAT_1`, `MAT_2` and on |
| Set Light | `AlexandriaSetLight` | Makes the selected surfaces or solids a standard V-Ray mesh light, on its sublayer of `DESIGN::ILLUMS` |
| Apply Day Settings | `AlexandriaDayRender`, right click `AlexandriaDayRenderView` | Sets V-Ray to the bright day on a light blue sky, with the custom lights off. Right click, *Render Day and Save*: then asks where to save, renders the active view and saves it |
| Apply Night Settings | `AlexandriaNightRender`, right click `AlexandriaNightRenderView` | Sets V-Ray to the dark night on a navy sky, where lit sign faces carry the image, with the custom lights back on. Right click, *Render Night and Save*: the same |
| Standard Dimension | `AlexandriaDimension`, right click `AlexandriaLeader` | Left click: a dimension. Right click, *Standard Leader*: a leader with a dot. Both in the Alexandria annotation styles, filed under `DETAILS::ANNOTATIONS` |
| Populate Detail | `AlexandriaPopulateDetail` | Adds the 2D drawing of a sign detail from the detail library to the model where you click |
| Layout Manager | `AlexandriaLayoutManager` | One window for the design package: its pages, project and client details with the info page, drawings, details, colors and materials with the CMF page, renders, the PDF and the project facts |
| Save as Rhino 7 | `AlexandriaSaveAsR7` | Saves a Rhino 7 copy next to your model as `<name>_r7.3dm`. You keep working in the original |
| Save as Rhino 8 | `AlexandriaSaveAsR8` | Saves a Rhino 8 copy next to your model as `<name>_r8.3dm`. You keep working in the original |

The render buttons need V-Ray for Rhino. They set the sky as the background, and V-Ray's world light, sun, ground plane, camera and image size, and switch the design's own lighting: every V-Ray light but the world light and the sun. Day turns it off and Night back on as you set it up, and lit faces stay in the render by day. They change no layers: hide the wall, ground and scale figure yourself to see more of the sky. Click **Populate Model** once in each new model, and again to bring an older model's layers and annotation styles up to the standard. Nothing needs installing for the annotation styles: Populate Model adds the Alexandria styles, and Standard Dimension adds any that are missing. The drawing standard behind them is in [STANDARDS.md](/docs/standards/#drawings).

## Updating

**With automatic updates on**, Rhino looks in the Alexandria folder each time it starts and installs any newer version it finds. Restart Rhino once more to load it.

**Without them**, run `PackageManager`, open the **Updates** tab, click **Update** on each Alexandria package, then restart Rhino.

After an update, restart Rhino and click **Alexandria Setup** once more. New buttons appear right away, the toolbar keeps its place, and the display modes update. With more than one Rhino open, close the others first: Rhino writes its toolbar back to the file when it closes, so the last one closed decides what opens next.

**Updating from 1.6**, click **Alexandria Setup** once: the toolbar leaves its own row and becomes a tab after **Standard**, with its new button order.

**Updating from 1.5 or earlier**, the toolbar disappears once: it now opens from Rhino's own UI folder instead of the package's, which changed at every update and lost the toolbar's place. Type `AlexandriaSetup` to bring it back for good. Grasshopper components already placed in definitions update by themselves. A definition saved before a component gained an input reports "Input parameter chunk is missing" once when it opens; save it again to clear the message.

To see which version you have, look at the **Installed** tab of the Package Manager.

## Moving from the Old Install

Before the packages, the components came as a package named **Alexandria Phoenix**, and the toolbar was a file dragged onto Rhino.

1. In the Package Manager's **Installed** tab, select **Alexandria Phoenix** and click **Uninstall**. Otherwise Grasshopper finds every component twice.
2. Install both packages as above and restart Rhino.
3. Click **Alexandria Setup**. It closes the dragged-in toolbar and updates the display modes in place.

## Uninstalling

In the Package Manager's **Installed** tab, select the package, click **Uninstall** and restart Rhino. The display modes stay; delete them in **Tools › Options › View › Display Modes** if you no longer want them.

## If Something's Missing

- **The packages don't show up in the search.** Check that File Explorer opens the folder, and that the sources value matches the one in step 1 exactly.
- **The toolbar doesn't appear.** Type `AlexandriaSetup`. If it's open but hidden, run `Toolbar`, pick **Alexandria Tools** in the list of toolbar files and tick **Alexandria Tools**.
- **The toolbar moved back.** With several Rhino windows open, each saves where the toolbars are when it closes, and the last one to close wins. Dock the toolbar in the Rhino you close last.
- **The right-hand panels look different.** Rhino keeps them per version, so a new Rhino starts with its own. Right click **Alexandria Setup** to arrange them to the standard. Panels that aren't on the standard list close, and you can open them again from **Panels** in the menu.
- **An `Alexandria…` command is unknown.** Alexandria Rhino Tools isn't installed or Rhino hasn't been restarted since.

## Claude in Rhino

Optional. McNeel's **Rhino-MCP-Platform** package adds an AI chat panel to Rhino, where Claude works in the open model and can run the Alexandria commands. Rhino 9 has the panel built in, but Rhino 8 doesn't: there, `AIPanel` exists only once the package is installed. The package needs Rhino 8.19 or later, running on .NET 8, Rhino 8's default. Claude needs a Pro or Max plan, or a Team or Enterprise seat, and each person signs in with their own account.

1. **Install the panel.** Run `PackageManager`, search for `Rhino-MCP-Platform` and install it. It's on McNeel's server, so it shows up without the Alexandria folder.
2. **Install Claude Code.** Open PowerShell and run:

   ```powershell
   irm https://claude.ai/install.ps1 | iex
   ```

   This puts Claude Code in `%USERPROFILE%\.local\bin`, where the panel looks for it. The copy inside the Claude desktop app doesn't count: the panel doesn't find it.
3. **Restart Rhino.**
4. **Sign in.** Type `AIPanel` to open the panel. In its chat box, type `/login` and press Enter, then sign in to Claude in the browser page that opens. Once per computer.
5. **Set it up.** Type `/settings` in the panel to open **AI Settings**:
   - **AI Agents:** select **Claude**, leave the model at its default and paste the prompt below into **Prompt**.
   - **Tools:** untick `close_doc`, which closes the open model and drops unsaved changes.
   - **MCP Servers** and **Loading:** leave them as they are.
   - Click **Save**.

The prompt tells Claude how Alexandria works, since it starts every chat knowing only the open model:

```
You're working inside Rhino 8 on sign design projects, with Alexandria Rhino Tools installed.

- Do what's asked and stop. No renders, layouts, exports or extra options unless asked.
- Use the Alexandria commands where they fit instead of rebuilding by hand (get_commands with filter "Alexandria" lists them): Populate Model, Set Material, Set Light, Populate Detail, Dimension, Leader, Layout Manager, Day/Night Render.
- Models are full size in inches, the sign at the origin facing -Y. Parts go on DESIGN sublayers, lit faces on DESIGN::ILLUMS, dimensions on DETAILS::ANNOTATIONS::DIMENSIONS, callouts on DETAILS::ANNOTATIONS::CALLOUTS.
- If the model is saved in a project's models folder (`design_models`), read the project's BRIEF.md and .claude/CLAUDE.md (one folder up) before starting. The full spec is STANDARDS.md in the shared alexandria_packages folder; read only the part the task touches.
- Don't save, close or overwrite files, or delete objects, unless asked.
- Keep replies short.
```

If it doesn't work:

- **`AIPanel` is an unknown command.** The package isn't installed, or Rhino hasn't been restarted since. If it is installed and Rhino says it couldn't load it, update Rhino 8 (**Help › Check for Updates**), and run `SetDotNetRuntime` to check Rhino is on .NET 8 (*NETCore*), not .NET Framework.
- **"Claude CLI not found. Install Claude Code."** Claude Code isn't in `%USERPROFILE%\.local\bin`, or Rhino hasn't been restarted since it was installed. Do step 2, then restart Rhino.
- **Claude needs sign-in.** Type `/login` in the panel again.
- **"No agent available."** In `/settings`, select **Claude** and tick **Enabled**.

## With a Copy of This Repo

The repo's `dist/` folder holds the same two packages as the shared folder, as of the last commit. Adding your clone's `dist` folder to the sources instead of the shared folder works the same way, but updates arrive only when you pull.
