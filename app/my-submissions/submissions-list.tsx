'use client';

import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import { formatPriceRange } from '@/lib/product-price';
import { deleteOwnProduct } from './actions';

export type SubmissionListRow={
  id:string;
  slug:string;
  name:string;
  price:number|string;
  min_price:number|string;
  max_price:number|string;
  category:string;
  status:string;
  rejection_reason:string|null;
  submitted_at:string;
  image:string|null;
  latestEdit:null|{
    id:string;
    status:string;
    rejection_reason:string|null;
    submitted_at:string;
  };
};

function DeleteSubmissionButton({id,name,onDeleted}:{id:string;name:string;onDeleted:(id:string)=>void}){
  const [pending,startTransition]=useTransition();
  const [error,setError]=useState('');

  function remove(){
    const confirmed=window.confirm(`Delete “${name}” permanently? This cannot be undone.`);
    if(!confirmed)return;
    setError('');
    startTransition(async()=>{
      const result=await deleteOwnProduct(id);
      if(result.ok)onDeleted(id);
      else setError(result.error||'Unable to delete this product.');
    });
  }

  return <div className="submission-delete-control">
    <button type="button" className="button secondary submission-delete-button" disabled={pending} onClick={remove}>
      {pending?'Deleting…':'Delete product'}
    </button>
    {error?<small role="alert">{error}</small>:null}
  </div>;
}

export function SubmissionsList({initialRows}:{initialRows:SubmissionListRow[]}){
  const [query,setQuery]=useState('');
  const [rows,setRows]=useState(initialRows);
  const filtered=useMemo(()=>{
    const needle=query.trim().toLowerCase();
    if(!needle)return rows;
    return rows.filter(row=>`${row.name} ${row.category} ${row.status}`.toLowerCase().includes(needle));
  },[query,rows]);

  return <>
    <div className="submission-search-wrap">
      <label className="filter-search">
        <Search size={19}/>
        <input
          value={query}
          onChange={event=>setQuery(event.target.value)}
          aria-label="Search your submissions"
          placeholder="Search your submissions..."
        />
        {query?<button type="button" onClick={()=>setQuery('')} aria-label="Clear submission search"><X size={18}/></button>:null}
      </label>
      <span className="results-meta" role="status">{filtered.length} {filtered.length===1?'submission':'submissions'}</span>
    </div>

    {filtered.length?<div className="submission-list">{filtered.map(row=>{
      const editPending=row.latestEdit?.status==='pending';
      const editRejected=row.latestEdit?.status==='rejected';
      return <article className="submission-row" key={row.id}>
        <div className="submission-thumb">{row.image?<img src={row.image} alt={row.name}/>:<span>Image unavailable</span>}</div>
        <div className="submission-copy">
          <div className="submission-status-line">
            <span className="status-pill" data-status={row.status}>{row.status}</span>
            <span>{new Date(row.submitted_at).toLocaleDateString('en-MY')}</span>
          </div>
          <h2>{row.name}</h2>
          <p>{row.category} · {formatPriceRange(Number(row.min_price??row.price),Number(row.max_price??row.min_price??row.price))}</p>

          {row.status==='rejected'&&row.rejection_reason?<p className="rejection-reason"><strong>Reason:</strong> {row.rejection_reason}</p>:null}
          {editPending?<p className="submission-edit-status"><strong>Edit pending review.</strong> Your current public product stays live until the edit is approved.</p>:null}
          {editRejected&&row.latestEdit?.rejection_reason?<p className="rejection-reason"><strong>Last edit rejected:</strong> {row.latestEdit.rejection_reason}</p>:null}

          <div className="submission-product-actions">
            {row.status==='approved'?<>
              <Link className="button secondary submission-action-button" href={`/items/${row.slug}`}>View public product</Link>
              <Link className="button secondary submission-action-button" href={`/my-submissions/${row.id}/analytics`}>Analytics</Link>
              {editPending
                ? <span className="button secondary submission-action-button submission-action-disabled" aria-disabled="true">Edit pending</span>
                : <Link className="button secondary submission-action-button" href={`/edit-product/${row.id}`}>Edit product</Link>}
            </>:null}
            <DeleteSubmissionButton id={row.id} name={row.name} onDeleted={id=>setRows(current=>current.filter(item=>item.id!==id))}/>
          </div>
        </div>
      </article>;
    })}</div>:<div className="empty-state">
      <Search size={30}/>
      <h2>{rows.length?'No submissions found':'No submissions yet'}</h2>
      <p>{rows.length?'Try another search.':'Your submitted products will appear here.'}</p>
      {rows.length?<button type="button" className="button" onClick={()=>setQuery('')}>Clear search</button>:<Link href="/submit-product" prefetch={false} className="button">Submit a product</Link>}
    </div>}
  </>;
}
