import { useState, type SubmitEvent } from "react";
import { parseCheckIns } from "../lib/check-ins";

export function CheckInImport({ merge }: { merge: (days: Set<string>) => Promise<void> }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function importCheckIns(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const json = new FormData(form).get("check-ins");
    if (typeof json !== "string") return;

    let days: Set<string>;
    try {
      days = parseCheckIns(json);
    } catch {
      setMessage("Copy the full check-in history from the original site and try again.");
      return;
    }

    setBusy(true);
    try {
      await merge(days);
      form.reset();
      setMessage(days.size ? "Check-ins imported." : "There are no check-ins to import.");
    } catch {
      setMessage("Couldn’t save check-ins in this browser. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="check-in-storage">
      <p className="message">Check-ins are saved in this browser.</p>
      <details>
        <summary>Import previous check-ins</summary>
        <p className="message">
          Open your <a href="https://back-mobility.serenesravan.chatgpt.site/api/check-ins" target="_blank" rel="noreferrer">check-in history on the original site</a> while signed in, then copy and paste it here.
        </p>
        <form onSubmit={importCheckIns}>
          <label htmlFor="check-in-data">Check-in history</label>
          <textarea id="check-in-data" name="check-ins" rows={3} required />
          <button className="text-button" type="submit" disabled={busy}>Import check-ins</button>
          <p className="message" role="status">{message}</p>
        </form>
      </details>
    </div>
  );
}
