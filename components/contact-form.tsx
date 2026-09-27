'use client';
import { useRef, useState, type FormEvent } from 'react';
export function ContactForm() {
  const [status, setStatus] = useState<'idle'|'sending'|'success'|'error'>('idle');
  const pending = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    pending.current = true;
    setStatus('sending');
    try {
      const body = new URLSearchParams();
      new FormData(form).forEach((value, key) => body.append(key, String(value)));
      const response = await fetch('/__forms.html', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
      if (!response.ok) throw new Error('Submission failed');
      form.reset();
      setStatus('success');
    } catch { setStatus('error'); }
    finally { pending.current = false; }
  }
  return <form className="contact-form" name="pasar-karat-contact" method="POST" action="/__forms.html" onSubmit={submit} aria-busy={status==='sending'}>
    <input type="hidden" name="form-name" value="pasar-karat-contact"/>
    <div hidden><label>Leave this empty<input name="bot-field" tabIndex={-1} autoComplete="off"/></label></div>
    <label htmlFor="contact-name">Name *<input id="contact-name" name="name" autoComplete="name" required maxLength={150}/></label>
    <label htmlFor="contact-email">Email *<input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254}/></label>
    <label htmlFor="contact-subject">Subject *<input id="contact-subject" name="subject" required maxLength={200}/></label>
    <label htmlFor="contact-message">Message *<textarea id="contact-message" name="message" rows={6} required maxLength={10000}/></label>
    <button className="button" type="submit" disabled={status==='sending'}>{status==='sending'?'Sending…':'Send Message'}</button>
    <div aria-live="polite" role="status">{status==='success' && <p>Thank you! Your message has been sent.</p>}</div>
    {status==='error' && <p role="alert">Your message could not be sent. Please try again or contact us by email. Your message is still here.</p>}
  </form>;
}
