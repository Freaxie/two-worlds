# Research dossier — The Strange World of Dead Internet Protocols

This file documents what every on-screen and spoken claim rests on, how each protocol was
classified, and where the brief's draft narration was corrected for accuracy.

## How the research was done (and its limits)

* **Primary sources, read in full text.** The RFCs were read locally from the Ubuntu/Debian
  `doc-rfc` packages (snapshot 2023-01-21, `apt-get download doc-rfc-*`), including the
  RFC Editor's `rfc-index.txt`, which gives each RFC's current status (Informational,
  Historic, Draft Standard, …) and its Obsoletes/Obsoleted-by chain. Quotes below are
  verbatim from those files.
* **Secondary sources via web search.** The production sandbox could not open most websites
  directly (its network policy allows package registries only), so non-RFC facts were checked
  through web-search result summaries. The URLs are listed so every claim can be re-checked
  in a browser. Where sources disagreed, the film avoids the contested detail (see the
  fact-check log).
* **Nothing in the film depends on a single unverified source.** Dates, ports and counts on
  screen all come from RFC text unless marked otherwise.

## Classification used in the film

The brief asked to separate *obsolete*, *deprecated*, *niche* and *abandoned*. Each protocol
gets a **STATUS chip** on its on-screen specimen card.

| Protocol | Born | Spec | Status in film | Evidence |
|---|---|---|---|---|
| **Gopher** | 1991, Univ. of Minnesota | RFC 1436 (Mar 1993, Informational); `gopher:` URI RFC 4266 (2005) | **NICHE**: displaced by the Web, still alive among hobbyists | >2,200 servers by Nov 1993 (RFC 1689). Today roughly 300–400 servers (Veronica-2 counted 315 in 2023; gopherspace.de counted 380 in 2024). Browsers dropped it: Firefox removed built-in Gopher in Firefox 4, 2011 (Mozilla bug 388195), which is a *deprecation by clients*, not a death. |
| **Archie** | 1990, McGill University (Alan Emtage, with Bill Heelan and Peter Deutsch) | no RFC; described in RFC 1689 | **ABANDONED**: no meaningful ecosystem | Indexed ~2.1 M filenames on ~1,200 anonymous-FTP sites, ~30 servers (Nov 1993, RFC 1689). One legacy server at ICM, University of Warsaw is kept for historical purposes; hobbyists restored a working copy on emulated hardware in 2024. Its substrate is gone too: Chrome 88 (Jan 2021) and Firefox 90 (Jul 2021) removed FTP. |
| **WAIS** | early 1990s, Thinking Machines (with Apple, Dow Jones, KPMG Peat Marwick) | RFC 1625 (Jun 1994, Informational) "WAIS over Z39.50-1988" | **ABANDONED** | ~500 registered WAIS databases plus ~100 commercial (Nov 1993, RFC 1689). WAIS Inc. was sold to AOL in 1995. Its foundation, Z39.50, lives on in library catalogues (see RFC 1729), but WAIS itself does not. |
| **Finger** | Stanford AI Lab (SAIL), Les Earnest; RFC 742 Dec 1977 | RFC 742 → RFC 1194 → RFC 1196 → RFC 1288 (Dec 1991, *still* Draft Standard) | **OBSOLETE**: mostly switched off, rare hobbyist use | RFC 1288 §3.2 itself warns: *"Warning!! Finger discloses information about users"*. `fingerd` was one of the two flaws exploited by the 1988 Morris worm (Spafford, Purdue CSD-TR-823). |
| **IPX/SPX** | 1980s, Novell NetWare (IPX ≈ Xerox XNS IDP) | RFC 1234 (1991) and RFC 1552 (1993), both reclassified **HISTORIC** | **OBSOLETE**; also the film's clearest **DEPRECATED** example (IETF Historic) | NetWare 5 (1998) made "Pure IP" the primary transport. Windows Vista no longer ships NWLink. Linux moved IPX to staging (4.16) and deleted it (2018, "staging: remove ncpfs and ipx code"). DOS-era LAN games used it; *Doom* (1993) shipped 4-player IPX play. |
| **X.25** | 1976, CCITT (now ITU-T) | ITU-T Rec. X.25; IP over X.25: RFC 877 (1983) → RFC 1356 (1992, Draft Standard) | **OBSOLETE**, with legacy pockets | Public data networks (e.g. Datapac 1976, Transpac 1978). From the early 1990s displaced by Frame Relay, then IP. Niche legacy use persisted (e.g. US NADIN air-traffic data network). The ITU recommendation was never withdrawn, so "deprecated" would be inaccurate. |
| **NNTP / Usenet** | Usenet 1979–80 (Truscott, Ellis, Bellovin; Duke/UNC); NNTP RFC 977 (Feb 1986, Kantor & Lapsley) | RFC 977 obsoleted by **RFC 3977** (Oct 2006, Proposed Standard) | **ALIVE (niche)** | The *spec* was superseded, the *protocol* lives. Google Groups stopped carrying Usenet on 22 Feb 2024, but NNTP servers and providers continue. |
| **IRC** | Aug 1988, University of Oulu (Jarkko Oikarinen) | RFC 1459 (May 1993, Experimental); RFC 2810–2813 (Apr 2000, Informational) | **ALIVE (niche)** | Libera.Chat (founded 2021): ~150,000 registered accounts and 1,028 registered projects at year-end 2025 (annual report), ~30k concurrent users. |

Summary of the four categories as the film uses them:

* **Obsolete** (replaced, rarely used): Finger, IPX/SPX, X.25
* **Deprecated** (officially retired or dropped by implementers): IPX-over-IP RFCs → IETF *Historic*; Gopher and FTP removed from mainstream browsers
* **Niche** (small, living communities): Gopher, IRC, Usenet/NNTP
* **Abandoned** (no meaningful ecosystem): Archie, WAIS

## Fact-check log: changes to the brief's draft narration

| Draft line / idea | Issue | What the film says instead |
|---|---|---|
| Archie "long before modern search engines existed" | Archie dates from 1990; web search engines arrived 1993–94, so "long before" overstates it | "…years before web search engines." |
| Gopher shown as simply dead | Gopher still has a few hundred servers | Status **NICHE**; Scene 6 adds "and Gopher still answers on a few hundred servers." |
| Finger "1971" (common claim) | Les Earnest's own page dates his Finger program to 1974–75; sources disagree | The film names SAIL and Les Earnest and dates Finger only by RFC 742 (1977) and RFC 1288 (1991). |
| WAIS (absent from the storyboard) | The brief asked to investigate it | Added to Scene 3: "And WAIS went further, searching the text inside the documents themselves." Origin year is disputed (1989 vs 1991), so the card says "early 1990s". |
| X.25 / IPX as "dead" | Different situations: IPX's IETF documents are *Historic*; X.25 was displaced but never withdrawn | Separate cards: IPX "OBSOLETE · IETF: IPX-over-IP RFCs Historic"; X.25 "OBSOLETE · legacy pockets remain". |
| "THE INTERNET NEVER FORGETS." | A slogan, not a fact (Archie's software was nearly lost before its 2024 rescue) | Kept as the brief's closing line, framed by the narration "…it becomes archaeology". This nuance is recorded here. |

## Verbatim primary-source quotes used on screen

* RFC 1436 (Gopher): *"Gopher servers should listen on port 70 (port 70 is assigned to Internet Gopher by IANA)."* Menus: *"the user sees what amounts to one big networked information system containing primarily document items, directory items, and search items."*
* RFC 1689 (status report, Aug 1994): *"As of November 1993, there were over 2200 known [Gopher] servers."* / Archie *"tracks over 2,100,000 filenames on over 1,200 sites around the world (as of November 1993). There are about 30 … archie servers."* / WAIS: *"Matching documents are rank-ordered according to a simple statistical weighting scheme which attempts to indicate likely relevance. The user may choose to view selected documents, or further refine the search. The results of one search may be used to successively refine future searches ("relevance feedback")."* (shown verbatim in the WAIS reconstruction)
* RFC 1288 (Finger) §1.2: *"The FINGER program at SAIL, written by Les Earnest, was the inspiration for the NAME program on ITS."* §2.1: *"Finger is based on the Transmission Control Protocol, using TCP port 79 decimal (117 octal)."*. §3.2: *"Warning!! Finger discloses information about users"* (shown on screen).
* RFC 977 (NNTP): server listens at *"TCP port 119"*.
* RFC 1459 (IRC): *"first implemented as a means for users on a BBS to chat amongst themselves."*
* RFC 1234 (IPX on IP, now Historic): *"Internet Packet eXchange protocol (IPX) is the internetwork protocol used by Novell's NetWare protocol suite… functionally equivalent to the Internet Datagram Protocol (IDP) from the Xerox Network Systems (XNS) protocol suite"*; IPX header = 30 octets (Figure 1).
* RFC 877 (IP over X.25): *"the transmission of IP datagrams over the X.25-based public data networks"*; *"An X.25 virtual circuit is opened on demand…"*.

## What is reconstruction, not record

All interfaces are **illustrative reconstructions**, and each is labelled so on screen:
hostnames use reserved `.example` domains (RFC 2606) or well-known historical archive hosts
(`archie.mcgill.ca`, `sunsite.unc.edu`, `tsx-11.mit.edu`, `nic.funet.fi`); the Finger user
"Alex", IRC nicks and Usenet subjects are invented; the LAN game is an original design, not a
recreation of any real game. Packet headers are real formats with sample values: the IPX
header (RFC 1234 layout), an X.25 data packet (GFI/LCN/P(R) M P(S)) and the textbook IPv4
header example `45 00 00 3C 1C 46 40 00 40 06 B1 E6 …`.

## Sources

**Primary: IETF / RFC Editor / ITU**
* RFC 742 NAME/FINGER (1977): https://www.rfc-editor.org/rfc/rfc742
* RFC 877 IP over public data networks (1983): https://www.rfc-editor.org/rfc/rfc877
* RFC 977 NNTP (1986): https://www.rfc-editor.org/rfc/rfc977
* RFC 1132 802.2 over IPX (1989): https://www.rfc-editor.org/rfc/rfc1132
* RFC 1234 Tunneling IPX through IP (1991, Historic): https://www.rfc-editor.org/rfc/rfc1234
* RFC 1288 Finger (1991): https://www.rfc-editor.org/rfc/rfc1288
* RFC 1356 Multiprotocol interconnect on X.25 (1992): https://www.rfc-editor.org/rfc/rfc1356
* RFC 1436 Gopher (1993): https://www.rfc-editor.org/rfc/rfc1436
* RFC 1459 IRC (1993): https://www.rfc-editor.org/rfc/rfc1459
* RFC 1552 PPP IPXCP (1993, Historic): https://www.rfc-editor.org/rfc/rfc1552
* RFC 1625 WAIS over Z39.50-1988 (1994): https://www.rfc-editor.org/rfc/rfc1625
* RFC 1689 / FYI 25, Status report on networked information retrieval (1994): https://www.rfc-editor.org/rfc/rfc1689
* RFC 1729 Using the Z39.50 protocol (1994): https://www.rfc-editor.org/rfc/rfc1729
* RFC 2810–2813 IRC (2000): https://www.rfc-editor.org/rfc/rfc2810
* RFC 3977 NNTP (2006): https://www.rfc-editor.org/rfc/rfc3977
* RFC 4266 gopher URI scheme (2005): https://www.rfc-editor.org/rfc/rfc4266
* RFC index with current statuses: https://www.rfc-editor.org/rfc-index.txt
* ITU-T Recommendation X.25: https://www.itu.int/rec/T-REC-X.25

**Secondary: history and current status**
* Les Earnest on Finger: https://web.stanford.edu/~learnest/sail/finger.html
* McGill, "Creation of the first internet search engine": https://200.mcgill.ca/history/creation-of-the-first-internet-search-engine/
* Archie rescue (2024): https://hackaday.com/2024/05/20/finding-and-resurrecting-archie-the-internets-first-search-engine
* Archie overview: https://en.wikipedia.org/wiki/Archie_(search_engine)
* Gopher history and licensing (1993): https://thenewstack.io/gopher-ruled-internet/ · https://mncomputinghistory.com/gopher-protocol/
* Gopher today (server counts): https://en.wikipedia.org/wiki/Gopher_(protocol)
* Firefox removes Gopher (bug 388195): https://bugzilla.mozilla.org/show_bug.cgi?id=388195
* Firefox 90 removes FTP: https://blog.mozilla.org/security/2021/07/20/stopping-ftp-support-in-firefox-90/
* WAIS: https://en.wikipedia.org/wiki/Wide_area_information_server · https://historyofinformation.com/detail.php?entryid=1998
* Morris worm analysis (Spafford, 1988): https://pages.cs.wisc.edu/~remzi/Classes/736/Spring2000/Papers/internet-worm.pdf
* NetWare 5 "Pure IP": https://support.novell.com/techcenter/articles/ana19980903.html
* IPX/SPX overview (Windows Vista drops NWLink): https://en.wikipedia.org/wiki/IPX/SPX
* Linux removes IPX (2018): https://lore.kernel.org/netdev/20180601184547.20213-1-gregkh@linuxfoundation.org/T/
* Doom's IPX networking: https://doomwiki.org/wiki/Doom_networking_component
* X.25 and public data networks: https://en.wikipedia.org/wiki/X.25 · https://en.wikipedia.org/wiki/Public_data_network
* Usenet origins: https://www.britannica.com/technology/Usenet · https://www.cs.columbia.edu/~smb/blog/2019-11/index.html
* Google Groups ends Usenet support (22 Feb 2024): https://support.google.com/groups/answer/11036538
* IRC history (Oikarinen's account): https://www.mirc.co.uk/history.html
* Libera.Chat annual report 2025: https://libera.chat/annual-reports/2025/
