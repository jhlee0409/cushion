import { useState, useEffect } from 'react';
import { setupCushion, absorb, reset } from 'cushion';

// Mock API responses
const mockResponses = {
  v1: {
    user_name: '김개발 v1',
    user_email: 'dev@example.com',
    created_at: '2024-01-15',
    profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kimdev',
  },
  v2: {
    userName: '김개발 v2',
    userEmail: 'dev@example.com',
    createdAt: '2024-01-15',
    profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kimdev',
  },
  nested: {
    user: {
      profile: {
        name: '김개발 v3',
        email: 'dev@example.com',
      },
      metadata: {
        createdAt: '2024-01-15',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kimdev',
      },
    },
  },
};

// 안전한 매핑 정의 (eval 대신 사용)
const safeMappings = {
  v1: {
    name: 'user_name',
    email: 'user_email',
    joinDate: 'created_at',
    avatar: 'profile_image'
  },
  v2: {
    name: 'userName',
    email: 'userEmail',
    joinDate: 'createdAt',
    avatar: 'profileImage'
  },
  nested: {
    name: 'user.profile.name',
    email: 'user.profile.email',
    joinDate: 'user.metadata.createdAt',
    avatar: 'user.metadata.avatar'
  }
};

function App() {
  const [apiVersion, setApiVersion] = useState<'v1' | 'v2' | 'nested'>('v1');
  const [mappingCode, setMappingCode] = useState(`{
  name: 'user_name',
  email: 'user_email',
  joinDate: 'created_at',
  avatar: 'profile_image'
}`);
  const [fetchResult, setFetchResult] = useState<any>(null);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Mock fetch setup
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      
      if (url === '/api/user') {
        // 서버 응답 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 300)); // 네트워크 지연 시뮬레이션
        
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockResponses[apiVersion],
          clone: () => ({ json: async () => mockResponses[apiVersion] })
        } as Response);
      }
      
      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [apiVersion]);

  // useEffect for API version updates
  useEffect(() => {
    updateMapping();
  }, [apiVersion]);

  const updateMapping = () => {
    try {
      const wasAutoMode = isAutoMode;
      reset();
      setIsAutoMode(false);

      const mapping = safeMappings[apiVersion];
      setMappingCode(JSON.stringify(mapping, null, 2));

      // 자동 모드가 활성화되어 있었다면 새로운 mapping으로 다시 설정
      if (wasAutoMode) {
        setTimeout(() => {
          setupAutoTransform();
        }, 100);
      }
    } catch (error) {
      console.error('Error updating mapping:', error);
    }
  };

  const setupAutoTransform = () => {
    try {
      reset();
      const mapping = safeMappings[apiVersion];
      setupCushion('/api/user', mapping);
      addLog('✅ Auto-transform 활성화됨');
      setIsAutoMode(true);
    } catch (error) {
      addLog(`❌ 오류: ${error}`);
    }
  };

  const fetchWithAuto = async () => {
    try {
      if (!isAutoMode) {
        addLog('❌ Auto-transform가 활성화되지 않았습니다');
        return;
      }

      // 실제 fetch 호출 (Cushion이 자동으로 변환)
      addLog('🌐 fetch("/api/user") 호출...');
      addLog(`📡 서버 응답: ${apiVersion} API 형태`);
      
      const response = await fetch('/api/user');
      const data = await response.json();
      
      setFetchResult(data);
      addLog('✅ 자동 변환 완료! 프론트엔드 코드는 항상 같은 형태로 받음');
      addLog('👍 서버 API가 바뀌어도 프론트엔드 코드는 그대로!');
    } catch (error) {
      addLog(`❌ Fetch 오류: ${error}`);
    }
  };

  const fetchWithManual = async () => {
    try {
      // 수동 변환: 원본 데이터를 받아서 absorb 함수로 직접 변환
      addLog('Fetch called: /api/user (수동 변환 모드)');
      const rawData = mockResponses[apiVersion];
      addLog(`원본 데이터: ${JSON.stringify(rawData)}`);

      const mapping = safeMappings[apiVersion];
      addLog(`변환 규칙: ${JSON.stringify(mapping)}`);

      const transformedData = absorb(rawData, mapping);
      setFetchResult(transformedData);
      addLog('✅ 수동 변환 완료 (absorb 함수 직접 호출)');
    } catch (error) {
      addLog(`❌ 변환 오류: ${error}`);
    }
  };

  const clearAll = () => {
    reset();
    setIsAutoMode(false);
    setFetchResult(null);
    setLogs([]);
    addLog('🔄 초기화 완료');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cushion-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-cushion-900 mb-4">
            🛏️ Cushion Playground
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            서버 스키마가 변경되어도 프론트엔드 코드는 그대로!
          </p>
          
          {/* Scenario Description */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🎯 시나리오: 백엔드 팀의 API 변경</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-bold text-red-600 mb-2">😱 기존 방식</h3>
                <p className="text-sm text-gray-600">
                  서버 API가 바뀌면 프론트엔드 코드도 수정해야 함
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-bold text-green-600 mb-2">🛏️ Cushion 방식</h3>
                <p className="text-sm text-gray-600">
                  변환 규칙만 설정하면 프론트엔드 코드는 그대로
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-bold text-blue-600 mb-2">🚀 결과</h3>
                <p className="text-sm text-gray-600">
                  개발 속도 향상, 유지보수 비용 절감
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Configuration */}
          <div className="space-y-6">
            {/* API Version Selector */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">1️⃣ 서버 API 버전</h2>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="version"
                    value="v1"
                    checked={apiVersion === 'v1'}
                    onChange={(e) => setApiVersion(e.target.value as any)}
                    className="w-4 h-4 text-cushion-600"
                  />
                  <span className="text-lg">v1 (snake_case)</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="version"
                    value="v2"
                    checked={apiVersion === 'v2'}
                    onChange={(e) => setApiVersion(e.target.value as any)}
                    className="w-4 h-4 text-cushion-600"
                  />
                  <span className="text-lg">v2 (camelCase)</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="version"
                    value="nested"
                    checked={apiVersion === 'nested'}
                    onChange={(e) => setApiVersion(e.target.value as any)}
                    className="w-4 h-4 text-cushion-600"
                  />
                  <span className="text-lg">v3 (Nested Structure)</span>
                </label>
              </div>

              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-2">서버 응답:</p>
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(mockResponses[apiVersion], null, 2)}
                </pre>
              </div>
            </div>

            {/* Mapping Configuration */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">2️⃣ 변환 규칙 설정</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Cushion Mapping:</label>
                  <textarea
                    value={mappingCode}
                    readOnly
                    className="input font-mono text-sm h-32 bg-gray-50"
                  />
                </div>
                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  💡 <strong>자동 업데이트:</strong> API 버전을 변경하면 변환 규칙이 자동으로 업데이트됩니다.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">3️⃣ 테스트</h2>
              <div className="space-y-3">
                <button
                  onClick={setupAutoTransform}
                  className="btn btn-primary w-full"
                  disabled={isAutoMode}
                >
                  🚀 Auto-transform 활성화
                </button>
                <button
                  onClick={fetchWithAuto}
                  className="btn btn-primary w-full"
                  disabled={!isAutoMode}
                >
                  📡 Fetch (자동 변환)
                </button>
                <button
                  onClick={fetchWithManual}
                  className="btn btn-secondary w-full"
                >
                  🔧 Fetch (수동 변환)
                </button>
                <button
                  onClick={clearAll}
                  className="btn btn-secondary w-full"
                >
                  🔄 모두 초기화
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="space-y-6">
            {/* Result Display */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">📊 변환 결과</h2>
              {fetchResult ? (
                <div className="space-y-4">
                  {/* User Card */}
                  <div className="flex items-center space-x-4 p-4 bg-cushion-50 rounded-lg">
                    <img
                      src={fetchResult.avatar}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full"
                    />
                    <div>
                      <h3 className="text-xl font-semibold">{fetchResult.name}</h3>
                      <p className="text-gray-600">{fetchResult.email}</p>
                      <p className="text-sm text-gray-500">가입일: {fetchResult.joinDate}</p>
                    </div>
                  </div>

                  {/* Raw JSON */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      변환된 데이터 (프론트엔드가 사용하는 형태):
                    </p>
                    <pre className="text-sm bg-gray-100 p-3 rounded-lg overflow-x-auto">
                      {JSON.stringify(fetchResult, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  아직 데이터를 가져오지 않았습니다
                </p>
              )}
            </div>

            {/* Logs */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">📝 로그</h2>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
                {logs.length > 0 ? (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">로그가 비어있습니다...</p>
                )}
              </div>
            </div>

            {/* Frontend Code Example */}
            <div className="card bg-cushion-50 border-cushion-200">
              <h3 className="text-lg font-bold mb-4 text-cushion-900">💻 프론트엔드 코드 (변경 없음!)</h3>
              <pre className="bg-gray-800 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
{`// 🎯 이 코드는 서버 API가 바뀌어도 그대로!
const response = await fetch('/api/user');
const user = await response.json();

// 항상 같은 형태로 사용
console.log(user.name);     // 김개발
console.log(user.email);    // dev@example.com
console.log(user.joinDate); // 2024-01-15
console.log(user.avatar);   // 프로필 이미지`}
              </pre>
              
              <div className="mt-4 p-3 bg-white rounded-lg border">
                <h4 className="font-bold text-gray-800 mb-2">🛏️ Cushion의 마법</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>✅ 서버 API 변경 시 변환 규칙만 수정</li>
                  <li>✅ 프론트엔드 코드는 한 줄도 수정 안 함</li>
                  <li>✅ 자동 변환으로 개발자 실수 방지</li>
                  <li>✅ 타입 안정성 유지</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;