export default function RecentCases({ cases = [], onCaseSelect }) {
  return (
    <div className="cases-table-wrap">
      <table className="cases-table">
        <caption className="sr-only">Recent forensic investigations</caption>
        <thead>
          <tr>
            <th scope="col">Case ID</th>
            <th scope="col">Case Title</th>
            <th scope="col">Status</th>
            <th scope="col">Assigned Analyst</th>
            <th scope="col">Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((item) => (
            <tr
              key={item.caseId}
              className="case-row"
              tabIndex={0}
              role="button"
              aria-label={`Open case ${item.caseId} ${item.title}`}
              onClick={() => onCaseSelect?.(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onCaseSelect?.(item);
                }
              }}
            >
              <td data-label="Case ID">{item.caseId}</td>
              <td data-label="Case Title">{item.title}</td>
              <td data-label="Status">
                <span className={`case-status case-status--${item.status.toLowerCase()}`}>{item.status}</span>
              </td>
              <td data-label="Assigned Analyst">{item.assignedAnalyst}</td>
              <td data-label="Last Updated">{item.lastUpdated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
