// replace your existing useMutation(...) with this:
const processUrlMutation = useMutation({
  mutationFn: async (rawUrl: string) => {
    setStatus('Validating URL…');
    const safe = normalizeUrl(rawUrl);
    if (!safe) throw new Error('Please enter a valid news article URL (http/https).');

    // 1) Try generated client first
    const fn = (backend as any)?.news?.process;
    if (typeof fn === 'function') {
      setStatus('Calling backend.news.process (client)…');
      console.log('[Hero] client → news.process', { url: safe });
      try {
        return await fn({ url: safe });
      } catch (e) {
        console.warn('[Hero] client call failed, will try direct fetch', e);
      }
    } else {
      console.warn('[Hero] backend.news.process not found on client; trying direct fetch');
    }

    // 2) Direct fetch fallback #1 (Encore usually mounts as /news/... for the "news" service)
    setStatus('Calling /news/article/process (fetch)…');
    try {
      const r1 = await fetch('/news/article/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: safe }),
      });
      if (!r1.ok) throw new Error(`HTTP ${r1.status}`);
      return await r1.json();
    } catch (e) {
      console.warn('[Hero] /news/article/process failed, trying /article/process', e);
    }

    // 3) Direct fetch fallback #2 (some setups mount exactly as declared)
    setStatus('Calling /article/process (fetch)…');
    const r2 = await fetch('/article/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: safe }),
    });
    if (!r2.ok) throw new Error(`HTTP ${r2.status}`);
    return await r2.json();
  },

  onSuccess: (res: any) => {
    if (res?.rateLimited) {
      setResetTime(res.resetTime);
      setShowPaywall(true);
      setStatus('Rate limited — showing paywall modal.');
      return;
    }
    if (!res?.success || !res?.id) {
      setStatus(`Backend returned error: ${res?.error || 'unknown error'}`);
      toast({
        title: 'Could not analyze',
        description: res?.error || 'Please try another URL.',
        variant: 'destructive',
      });
      return;
    }
    setStatus(`Success. Navigating to /article/${res.id}`);
    navigate(`/article/${res.id}`);
  },

  onError: (err: any) => {
    const msg = String(err?.message || err || 'Unknown error');
    console.error('[Hero] Error processing URL (after fallbacks):', err);
    setStatus(`Error: ${msg}`);
    toast({
      title: 'Error processing URL',
      description: msg.includes('Failed to fetch')
        ? 'Network / routing issue. Check DevTools → Network for the failing request.'
        : msg,
      variant: 'destructive',
    });
    alert(`Error processing URL:\n${msg}`);
  },
});
