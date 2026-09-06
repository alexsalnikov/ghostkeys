export type LearningPath='vim'|'tmux';
export function LearningPaths({current,onChange}:{current:LearningPath;onChange(path:LearningPath):void}){
  return <nav className="learning-paths" aria-label="Learning paths">
    <button aria-current={current==='vim'?'page':undefined} onClick={()=>onChange('vim')}>Vim path</button>
    <button aria-current={current==='tmux'?'page':undefined} onClick={()=>onChange('tmux')}>tmux path</button>
  </nav>;
}
