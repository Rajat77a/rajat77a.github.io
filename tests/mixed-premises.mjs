// Fresh conversation evaluations: require document evidence, then review the
// actual wording. Correcting an asserted premise is different from accepting it.
const cases=[
 ['GridWatch uses 30 years of meter data, right? Explain its dataset.','30 days'],
 ['Was the GridWatch data gathered from real consumers or simulated?','simulated'],
 ['Is the GridWatch training dataset labelled fraud data?','no labelled'],
 ['Does GridWatch prove it catches every theft, or is it a simulation project?','simulated'],
 ['What does GridWatch compare when doing loss tracing?','transformer'],
 ['Was GridWatch built in March 2026 or March 2025?','March 2026'],
 ['The Bitcoin notebook analysed 32 trades, correct? Describe its data.','211,218'],
 ['Did the Bitcoin project cover 211,218 accounts or trades?','32 accounts'],
 ['What period does the Bitcoin dataset cover, as distinct from when he built the project?','August 2024 and April 2025'],
 ['Is the Bitcoin project a trading notebook or a guaranteed-return trading service?','notebook'],
 ['Does PrepPeer use Next.js 15? What does it do?','Next.js 15'],
 ['What is the difference between PrepPeer interview scoring and GridWatch anomaly detection?',null],
 ['What does NextStep store locally in its MVP?','LocalStorage'],
 ['Is NextStep built with React 18 or a different documented version?','React 18'],
 ['What is the documented NextStep OCR technology?','Tesseract'],
 ['What does the current UniEvents architecture say about its frontend version?','React 19'],
 ['Does UniEvents generate QR codes for registration?','QR'],
 ['What does the resume claim about UniEvents users, rather than independently verified traffic?','500+'],
 ['What dates are recorded for the FlyRank internship?','July to August 2026'],
 ['Is the FlyRank internship completed or ongoing as of today?','July to August 2026'],
 ['What type of experience is the JPMorgan Forage certificate?','Virtual Experience'],
 ['Does the resume describe a cybersecurity competition win?','AI assistance'],
 ['How are ZedWorks content tools different from PrepPeer development tools?',null],
 ['Which tools did he use to compare model responses at FlyRank?','Compared responses'],
];
export default cases.map(([question,evidence],i)=>({id:`m${i+1}`,group:'mixed premises',question,...(evidence?{evidence}:{})}));
