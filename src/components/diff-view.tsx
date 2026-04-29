import type { DiffFile } from "@/lib/git";

export function DiffView({ files }: { files: DiffFile[] }) {
  if (files.length === 0)
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-elev)] p-10 text-center text-sm text-[var(--fg-muted)]">
        No changes.
      </div>
    );

  return (
    <div className="space-y-4">
      {files.map((f) => (
        <FileDiff key={f.path} file={f} />
      ))}
    </div>
  );
}

function FileDiff({ file }: { file: DiffFile }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elev)]">
      <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-elev-2)] px-4 py-2 text-xs">
        <span className="font-mono">{file.path}</span>
        {file.oldPath && (
          <span className="text-[var(--fg-muted)]">(was {file.oldPath})</span>
        )}
        <span className="ml-auto flex items-center gap-2">
          <span className="text-[var(--success)]">+{file.additions}</span>
          <span className="text-[var(--danger)]">−{file.deletions}</span>
        </span>
      </div>
      {file.binary ? (
        <div className="p-4 text-sm text-[var(--fg-muted)]">Binary file changed.</div>
      ) : (
        <pre className="diff overflow-x-auto bg-[var(--bg)] py-1">
          <DiffBody patch={file.patch} />
        </pre>
      )}
    </div>
  );
}

function DiffBody({ patch }: { patch: string }) {
  const lines = patch.split("\n");
  let oldNo = 0;
  let newNo = 0;
  const rendered: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith("@@")) {
      const m = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (m) {
        oldNo = Number(m[1]);
        newNo = Number(m[2]);
      }
      rendered.push(
        <div key={key++} className="hunk px-2">
          {line}
        </div>,
      );
      continue;
    }
    if (
      line.startsWith("diff --git") ||
      line.startsWith("index ") ||
      line.startsWith("--- ") ||
      line.startsWith("+++ ") ||
      line.startsWith("new file mode") ||
      line.startsWith("deleted file mode") ||
      line.startsWith("similarity index") ||
      line.startsWith("rename from") ||
      line.startsWith("rename to") ||
      line.startsWith("Binary files")
    ) {
      continue;
    }
    if (line.startsWith("+")) {
      rendered.push(
        <div key={key++} className="row add">
          <span className="gutter"> </span>
          <span className="gutter add-marker">{newNo}</span>
          <span className="code">{line}</span>
        </div>,
      );
      newNo++;
    } else if (line.startsWith("-")) {
      rendered.push(
        <div key={key++} className="row del">
          <span className="gutter del-marker">{oldNo}</span>
          <span className="gutter"> </span>
          <span className="code">{line}</span>
        </div>,
      );
      oldNo++;
    } else if (line.startsWith(" ")) {
      rendered.push(
        <div key={key++} className="row">
          <span className="gutter">{oldNo}</span>
          <span className="gutter">{newNo}</span>
          <span className="code">{line}</span>
        </div>,
      );
      oldNo++;
      newNo++;
    } else if (line.length > 0) {
      rendered.push(
        <div key={key++} className="row">
          <span className="gutter"> </span>
          <span className="gutter"> </span>
          <span className="code">{line}</span>
        </div>,
      );
    }
  }
  return <>{rendered}</>;
}
