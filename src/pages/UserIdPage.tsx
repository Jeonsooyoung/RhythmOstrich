// S10: 로컬 사용자 ID 입력
import { useState } from 'react';
import GardenLayout from '../components/GardenLayout';
import { getLastUserId, listUserIds } from '../state/sessionStore';

interface UserIdPageProps {
    onSubmit: (userId: string) => void;
}

const MAX_LENGTH = 20;

export default function UserIdPage({ onSubmit }: UserIdPageProps) {
    const [userId, setUserId] = useState(getLastUserId);
    const [knownIds] = useState(listUserIds);
    const trimmed = userId.trim();

    return (
        <GardenLayout
            phase="userId"
            eyebrow="WELCOME TO THE RHYTHM GARDEN"
            title="반가워요!"
            subtitle="기록을 구분할 이름이나 별명을 알려 주세요. 기록은 이 브라우저에만 저장돼요."
        >
            <form
                className="gp-card"
                onSubmit={event => {
                    event.preventDefault();
                    if (trimmed) onSubmit(trimmed);
                }}
            >
                <label htmlFor="user-id"><h2>사용자 ID</h2></label>
                <input
                    id="user-id"
                    className="gp-input"
                    value={userId}
                    maxLength={MAX_LENGTH}
                    placeholder="예: 타조사랑"
                    autoFocus
                    autoComplete="off"
                    onChange={event => setUserId(event.target.value)}
                />
                {knownIds.length > 0 && (
                    <div className="gp-chips" aria-label="이전에 사용한 ID">
                        {knownIds.map(id => (
                            <button key={id} type="button" className="gp-chip" onClick={() => setUserId(id)}>{id}</button>
                        ))}
                    </div>
                )}
                <div className="gp-actions">
                    <button type="submit" className="gp-button primary" disabled={!trimmed}>
                        시작하기 <span aria-hidden="true">→</span>
                    </button>
                </div>
            </form>
        </GardenLayout>
    );
}
