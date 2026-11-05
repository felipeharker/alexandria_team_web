<!-- Written by tools/sync.py from alexandria_phoenix/INSTALL.md. Edit it there and run the sync, not this page. -->

- **`AIPanel` is an unknown command.** The package isn't installed, or Rhino hasn't been restarted since. If it is installed and Rhino says it couldn't load it, update Rhino 8 (**Help › Check for Updates**), and run `SetDotNetRuntime` to check Rhino is on .NET 8 (*NETCore*), not .NET Framework.
- **"Claude CLI not found. Install Claude Code."** Claude Code isn't in `%USERPROFILE%\.local\bin`, or Rhino hasn't been restarted since it was installed. Do step 2, then restart Rhino.
- **Claude needs sign-in.** Type `/login` in the panel again.
- **"No agent available."** In `/settings`, select **Claude** and tick **Enabled**.
