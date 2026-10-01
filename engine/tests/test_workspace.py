from workspace.manager import WorkspaceManager


workspace = WorkspaceManager()

print()

print(workspace.info())

workspace.create()

print()

print("Workspace Ready!")