// S10: 로컬 사용자 ID 입력
import { useState } from 'react';
import { getLastUserId, listUserIds } from '../state/sessionStore';
import './flow.css';

interface UserIdPageProps {
    onSubmit: (userId: string) => void;
}

const MAX_LENGTH = 20;

export default function UserIdPage({ onSubmit }: UserIdPageProps) {
    const [userId, setUserId] = useState(getLastUserId);
    const [knownIds] = useState(listUserIds);
    const trimmed = userId.trim();

    return (
        <main className="flow-page">
            <h1>리듬타조</h1>
            <p className="flow-lead">기록을 구분할 이름이나 별명을 입력해 주세요. 기록은 이 브라우저에만 저장돼요.</p>
            <form
                className="flow-card"
                onSubmit={event => {
                    event.preventDefault();
                    if (trimmed) onSubmit(trimmed);
                }}
            >
                <label htmlFor="user-id"><h2>사용자 ID</h2></label>
                <input
                    id="user-id"
                    className="flow-input"
                    value={userId}
                    maxLength={MAX_LENGTH}
                    autoFocus
                    autoComplete="off"
                    list="known-user-ids"
                    onChange={event => setUserId(event.target.value)}
                />
                <datalist id="known-user-ids">
                    {knownIds.map(id => <option key={id} value={id} />)}
                </datalist>
                <div className="flow-actions">
                    <button type="submit" className="primary" disabled={!trimmed}>시작하기</button>
                </div>
            </form>
        </main>
    );
}
