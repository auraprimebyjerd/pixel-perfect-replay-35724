# Account registration improvements
- [ ] Disable hosted signup email confirmation — blocked: existing security setting values are unavailable; user must enable Auto-confirm email in Auth settings → Email.
- [x] Show account-created notice and sign-in after auto-confirmed registration; safely retain confirmation fallback until hosted setting changes.
- [x] Test registration session teardown and duplicate protection; check public sign-in/reset views and authenticated dashboard.
- [ ] Test real new-account registration, credential login and delivered password-reset link — blocked by hosted confirmation setting and unavailable test mailbox.
- [x] Decline payment/voucher proof to unlock cash; leave Instant Cash unchanged.