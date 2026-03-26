import IssueCard from './IssueCard'

export default function IssueList({ issues, onVote, onResolve, onStatusChange, onAddComment, isAdmin }) {
  return (
    <div className="issue-list">
      {issues.map((issue) => (
        <IssueCard
          key={issue.id}
          issue={issue}
          onVote={onVote}
          onResolve={onResolve}
          onStatusChange={onStatusChange}
          onAddComment={onAddComment}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  )
}
