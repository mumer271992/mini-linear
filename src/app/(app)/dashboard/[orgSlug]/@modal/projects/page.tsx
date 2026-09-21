// Client-side navigation away from the intercepted (.)create route doesn't
// automatically clear this slot -- Next.js keeps a parallel slot's last
// content unless something inside it explicitly matches the new URL and
// renders null. This is that explicit match for the projects list, the only
// destination the modal ever navigates back to (Close, backdrop click, and
// Escape all resolve to the same router.push). Browser back/forward doesn't
// need this -- Next.js restores the slot's actual prior history state on its
// own for that case.
export default function ProjectsModalSlot() {
  return null;
}
