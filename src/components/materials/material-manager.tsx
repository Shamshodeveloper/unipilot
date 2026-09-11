"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { validateMaterialFile } from "@/lib/validation/materials";

type Material = { id: string; file_name: string; mime_type: string; size_bytes: number; created_at: string };
const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });
export function MaterialManager({ subjectId, materials }: { subjectId: string; materials: Material[] | null }) {
  const router = useRouter();
  const picker = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const endpoint = `/subjects/${subjectId}/materials`;
  const disabled = busy || deleting !== null;

  function choose(files: FileList | null) {
    setError(""); setMessage(""); setFile(null);
    if (!files?.length) return;
    const invalid = files.length !== 1 ? "Choose one file at a time." : validateMaterialFile(files[0]);
    if (invalid) { setError(invalid); if (picker.current) picker.current.value = ""; return; }
    setFile(files[0]);
  }
  function upload() {
    if (!file || disabled) return;
    const invalid = validateMaterialFile(file);
    if (invalid) { setError(invalid); return; }
    setBusy(true); setError(""); setMessage(""); setProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.timeout = 180000;
    xhr.upload.onprogress = (event) => { if (event.lengthComputable) setProgress(Math.round(event.loaded / event.total * 100)); };
    const finish = (failure: string) => { setBusy(false); setError(failure); router.refresh(); };
    xhr.onerror = () => finish("Connection lost. Refresh the material list before retrying the upload.");
    xhr.ontimeout = () => finish("Upload timed out. Refresh the material list before retrying.");
    xhr.onload = () => {
      let result: { error?: string; success?: boolean };
      try { result = JSON.parse(xhr.responseText); } catch { finish("Upload could not be confirmed. Refresh the list and check your session."); return; }
      if (xhr.status !== 200 || !result.success) { finish(result.error || "Upload failed. Please try again."); return; }
      setFile(null); if (picker.current) picker.current.value = "";
      setMessage("Material uploaded."); finish("");
    };
    const data = new FormData(); data.set("file", file); xhr.send(data);
  }
  async function remove(material: Material) {
    if (disabled || !window.confirm(`Delete “${material.file_name}”? This removes the file and its metadata.`)) return;
    setDeleting(material.id); setError(""); setMessage("");
    try {
      const response = await fetch(`${endpoint}?materialId=${material.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) setError(result.error || "Deletion failed. Please try again.");
      else setMessage("Material deleted.");
    } catch { setError("Deletion could not be confirmed. Refresh the list before retrying."); }
    finally { setDeleting(null); router.refresh(); }
  }
  return <section aria-labelledby="materials-title" className="mt-8 rounded-3xl border border-ink/10 bg-white p-6 sm:p-8">
    <h2 id="materials-title" className="text-xl font-semibold">Materials</h2>
    <p className="mt-2 text-sm leading-6 text-muted">Private academic files for this subject. PDF, PNG, JPG/JPEG, or WEBP, up to 20 MB each.</p>
    <form onSubmit={(event) => { event.preventDefault(); upload(); }} aria-busy={busy} className="mt-6">
      <div onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); if (!disabled) choose(event.dataTransfer.files); }}
        className={`rounded-2xl border-2 border-dashed p-6 ${dragging ? "border-brand bg-brand/10" : "border-ink/20 bg-paper"}`}>
        <label htmlFor="material-file" className="block font-semibold">Drop a file here or choose a file</label>
        <input ref={picker} id="material-file" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp" disabled={disabled} onChange={(event) => choose(event.target.files)} aria-describedby="material-feedback" className="mt-4 block w-full min-w-0 text-sm file:mr-3 file:min-h-11 file:rounded-full file:border-0 file:bg-brand file:px-4 file:text-white disabled:opacity-60" />
        {file && <p className="mt-3 break-words text-sm text-muted">Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
      </div>
      <button type="submit" disabled={!file || disabled} className="button-primary mt-4 disabled:cursor-not-allowed disabled:opacity-60">{busy ? "Uploading…" : "Upload Material"}</button>
      {busy && <div role="status" className="mt-4 text-sm text-muted"><progress aria-label="File transfer progress" value={progress} max={100} className="w-full accent-brand" /><p>{progress < 100 ? `Transferring file: ${progress}%` : "Transfer complete. Saving to private storage…"}</p></div>}
    </form>
    <div id="material-feedback" aria-live="polite" className="mt-4">{error && <p role="alert" className="text-sm text-red-800">{error}</p>}{message && <p className="text-sm text-brand">{message}</p>}</div>
    {materials === null ? <p role="alert" className="mt-6 text-sm text-red-800">We couldn’t load materials. <a href={`/subjects/${subjectId}`} className="underline">Refresh to retry.</a></p> : !materials.length ? <p className="mt-6 rounded-2xl bg-paper p-5 text-sm text-muted">No materials yet. Upload your first lecture slides or notes.</p> : <ul className="mt-6 divide-y divide-ink/10">{materials.map((material) => <li key={material.id} className="flex flex-wrap items-center justify-between gap-4 py-5"><div className="min-w-0 flex-1"><h3 className="break-words font-semibold">{material.file_name}</h3><p className="mt-2 break-words text-sm text-muted">{material.mime_type} · {(material.size_bytes / 1024 / 1024).toFixed(2)} MB</p><p className="mt-1 text-sm text-muted">Uploaded <time dateTime={material.created_at}>{dateFormat.format(new Date(material.created_at))}</time></p></div><button type="button" disabled={disabled} onClick={() => remove(material)} aria-label={`Delete ${material.file_name}`} className="button-secondary text-red-800 disabled:opacity-60">{deleting === material.id ? "Deleting…" : "Delete"}</button></li>)}</ul>}
  </section>;
}
