# Palm Advising System permissions matrix

This matrix records the role boundaries and decisions currently available. Items marked provisional must be confirmed before production use.

| Capability | System Administrator | Academic Advisor | Student | Academic Coordinator |
|---|---|---|---|---|
| Manage accounts and link registered accounts to student/advisor profiles | Full | No | Self-register; verify email | No |
| View student profile and academic records | All students in system | Assigned students | Own records | Scoped summaries |
| Enter course grades | No | No | Own grades, pending confirmation | No |
| Confirm course grades | All submitted grades | No | No | No |
| Upload result slips | No | No | Own slips | No |
| View result slips | All students | Assigned students | No | No |
| Manage advisor assignments and capacity | Full | No | No | View workload in scope |
| Manage advising sessions | All sessions | Assigned students | Request, view, and cancel own sessions (24-hour notice is provisional) | View aggregate reports in scope |
| Student clock-in | No | No | Own booked session, within 15 minutes before/after the booked time | No |
| Advisor clock-out and sign meeting log | No | Assigned students | No | No |
| Manage notes and follow-ups | All records, subject to audit | Assigned students | No private notes | Summary only; private-note restriction is provisional |
| View and manage semester plans | All plans | Assigned students; sign to lock | Own plan | Summary only within scope |
| View risk flags | All students | Assigned students | No | Scoped summaries |
| View reports and audit logs | All | Advisor scope, except audit logs | No | Workload, flags, and reports within scope |

## Related controls and pending policy

- Staff accounts must require a password change at first login.
- Advisor capacity is 15 advisees.
- GPA uses confirmed grades only. Students may submit grades, but an administrator must confirm each grade before it counts.
- Result-slip access is limited to advisors and administrators; students may upload their own slips.
- Risk thresholds remain provisional. The current example is CGPA below 2.0 or at least three failing courses, using confirmed results only.
- Retention periods for result slips, notes, and audit records have not been provided.
- Advisor department scope and optional programme scope remain provisional.
- The 24-hour session cancellation rule and unlimited logged reschedules remain provisional.
- Student clock-in is allowed from 15 minutes before through 15 minutes after the booked start time. Advisor clock-out and signature are separate actions.
- Coordinator access to semester plans is summary-only. The separate restriction on private-note access remains provisional.
