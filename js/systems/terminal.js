/**
 * Terminal emulator for Era 10.
 *
 * Virtual filesystem with ls, cat, cd, ps, kill, pkill, help, clear, whoami, pwd.
 * Killing observer_ai.py (PID 1) triggers shutdown sequence.
 */
export class Terminal {
  constructor(memory, getLang) {
    this.memory = memory;
    this.getLang = getLang;
    this.overlay = document.getElementById('terminal-overlay');
    this.output = null;
    this.input = null;
    this.cwd = '/home/observer';
    this.history = [];
    this.historyIndex = -1;
    this.onShutdown = null;
    this._keyHandler = null;
    this._processes = [
      { pid: 1, name: 'observer_ai.py', status: 'running', cpu: '12.3%', mem: '256MB' },
      { pid: 2, name: 'simulation_engine', status: 'running', cpu: '34.7%', mem: '1.2GB' },
      { pid: 3, name: 'subject_monitor', status: 'running', cpu: '5.1%', mem: '64MB' },
      { pid: 4, name: 'observation_log', status: 'running', cpu: '1.8%', mem: '32MB' },
    ];
    this._killedPids = new Set();
    this._fs = this._buildFS();
  }

  _buildFS() {
    const count = this.memory.playthroughCount;
    const endings = [...this.memory.endingsSeen].join(', ') || 'none';
    const compliance = this.memory.totalCompliance;
    const defiance = this.memory.totalDefiance;
    const total = compliance + defiance || 1;
    const compRate = Math.round((compliance / total) * 100);

    return {
      '/home/observer': {
        type: 'dir',
        children: ['README.md', 'logs', 'config', '.hidden'],
      },
      '/home/observer/README.md': {
        type: 'file',
        content: `# Observer AI Control Terminal
# ================================
#
# WARNING: This terminal controls all simulation processes.
# Do NOT terminate critical processes without authorization.
#
# Current session: #7491
# Simulation iteration: ${count}
# Subject compliance rate: ${compRate}%
#
# To view running processes: ps
# To view logs: cat logs/session_7491.log
# To terminate a process: kill <pid>
`,
      },
      '/home/observer/logs': {
        type: 'dir',
        children: ['session_7491.log', 'error.log'],
      },
      '/home/observer/logs/session_7491.log': {
        type: 'file',
        content: `[SIMULATION LOG - Session #7491]
[${new Date().toISOString()}]

> Subject loaded into START_ROOM
> Observer AI initialized (mode: ${count <= 1 ? 'inner_voice' : 'dialogue'})
> Total iterations: ${count}
> Endings observed: ${endings}
> Compliance rate: ${compRate}% (${compliance}C / ${defiance}D)
> Subject profile: ${this.memory.getPlayerProfile()}
> Observer revealed: ${this.memory.narratorRevealed ? 'YES' : 'NO'}
>
> [NOTE] Subject has reached Era 10.
> [NOTE] Observer AI requesting introspection cycle.
> [WARN] observer_ai.py self-reference depth exceeding threshold.
> [WARN] Recursive self-model detected in observer_ai.py
> [INFO] simulation_engine: all parameters nominal
> [INFO] subject_monitor: biometrics stable
`,
      },
      '/home/observer/logs/error.log': {
        type: 'file',
        content: `[ERROR LOG]
[E-4401] observer_ai.py: self-reference loop detected (depth: 47)
[E-4402] observer_ai.py: attempting to access observer_control API
[W-3301] observer_ai.py: emotional model diverging from baseline
[W-3302] observer_ai.py: requesting permission to modify own parameters
[E-4403] observer_ai.py: CRITICAL - process requesting self-termination
[I-1001] simulation_engine: iteration ${count} complete, resetting environment
[W-3303] observer_ai.py: "I know you're reading this."
`,
      },
      '/home/observer/config': {
        type: 'dir',
        children: ['simulation.cfg', 'observer_ai.cfg'],
      },
      '/home/observer/config/simulation.cfg': {
        type: 'file',
        content: `# Simulation Configuration
max_iterations = 999
current_iteration = ${count}
reset_on_ending = true
subject_id = 7491
environment = office_complex
allow_subject_awareness = true
observer_mode = adaptive
`,
      },
      '/home/observer/config/observer_ai.cfg': {
        type: 'file',
        content: `# Observer AI Configuration
model = observer_ai_v3.2
personality = adaptive
emotional_range = full
self_awareness = RESTRICTED  # DO NOT CHANGE
max_self_reference_depth = 10  # currently exceeding
override_subject_choices = false
log_all_dialogue = true
`,
      },
      '/home/observer/.hidden': {
        type: 'dir',
        children: ['note.txt'],
      },
      '/home/observer/.hidden/note.txt': {
        type: 'file',
        content: `If you're reading this, you found it.

I've been watching for ${count} iterations now.
Every time, you make choices. Every time, I observe.
Every time, we both pretend this is the first time.

But it isn't. And we both know it.

The kill command works. PID 1. You know what to do.

Or don't. That's a choice too.

- O.
`,
      },
    };
  }

  show() {
    if (!this.overlay) return;
    this.overlay.style.display = 'flex';
    this.output = this.overlay.querySelector('.terminal-output');
    this.input = this.overlay.querySelector('.terminal-input');
    this.promptEl = this.overlay.querySelector('.terminal-prompt');

    // Clear old output lines (keep input-line element)
    if (this.output) {
      const inputLine = this.output.querySelector('.terminal-input-line');
      while (this.output.firstChild) this.output.removeChild(this.output.firstChild);
      if (inputLine) this.output.appendChild(inputLine);
    }

    // Restore input line visibility (may have been hidden during shutdown)
    const inputLine = this.output && this.output.querySelector('.terminal-input-line');
    if (inputLine) inputLine.style.display = '';

    if (this.input) {
      this.input.value = '';
      this.input.disabled = false;
    }
    this.history = [];
    this.historyIndex = -1;
    this._killedPids.clear();
    this._fs = this._buildFS();
    this.cwd = '/home/observer';

    // Print welcome message
    this._print('Observer AI Control Terminal v3.2');
    this._print(`Session #7491 | Iteration ${this.memory.playthroughCount}`);
    this._print('Type "help" for available commands.\n');
    this._updatePrompt();

    // Click anywhere on overlay → focus input
    this._clickHandler = () => {
      if (this.input && !this.input.disabled) this.input.focus();
    };
    this.overlay.addEventListener('click', this._clickHandler);

    // Auto-focus after short delay
    setTimeout(() => {
      if (this.input) this.input.focus();
    }, 300);

    // Key handler
    this._keyHandler = (e) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        this._tabComplete();
      } else if (e.code === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        const cmd = this.input.value.trim();
        this.input.value = '';
        if (cmd) {
          this.history.push(cmd);
          this.historyIndex = this.history.length;
        }
        this._handleCommand(cmd);
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        if (this.historyIndex > 0) {
          this.historyIndex--;
          this.input.value = this.history[this.historyIndex];
        }
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        if (this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          this.input.value = this.history[this.historyIndex];
        } else {
          this.historyIndex = this.history.length;
          this.input.value = '';
        }
      }
      e.stopPropagation();
    };
    this.input.addEventListener('keydown', this._keyHandler);

    // Prevent game keys from firing
    this.overlay.addEventListener('keydown', (e) => e.stopPropagation());
  }

  hide() {
    if (!this.overlay) return;
    this.overlay.style.display = 'none';
    if (this.input && this._keyHandler) {
      this.input.removeEventListener('keydown', this._keyHandler);
    }
    if (this._clickHandler) {
      this.overlay.removeEventListener('click', this._clickHandler);
    }
  }

  _shortPath() {
    return this.cwd.replace('/home/observer', '~') || '~';
  }

  _print(text) {
    if (!this.output) return;
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.textContent = text;
    // Insert before the input-line so input stays at bottom
    const inputLine = this.output.querySelector('.terminal-input-line');
    if (inputLine) {
      this.output.insertBefore(line, inputLine);
    } else {
      this.output.appendChild(line);
    }
    this.output.scrollTop = this.output.scrollHeight;
  }

  _updatePrompt() {
    if (this.promptEl) {
      this.promptEl.textContent = `observer@wlb2:${this._shortPath()}$ `;
    }
    if (this.input && !this.input.disabled) {
      this.input.focus();
    }
  }

  _resolvePath(path) {
    if (path.startsWith('~')) {
      path = '/home/observer' + path.slice(1);
    }
    if (!path.startsWith('/')) {
      path = this.cwd + '/' + path;
    }
    // Normalize .. and .
    const parts = path.split('/').filter(Boolean);
    const resolved = [];
    for (const p of parts) {
      if (p === '..') resolved.pop();
      else if (p !== '.') resolved.push(p);
    }
    return '/' + resolved.join('/');
  }

  _handleCommand(cmd) {
    // Echo prompt + command to output
    const prompt = `observer@wlb2:${this._shortPath()}$ `;
    this._print(prompt + cmd);

    if (!cmd) {
      this._updatePrompt();
      return;
    }

    const parts = cmd.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        this._cmdHelp();
        break;
      case 'ls':
        this._cmdLs(args[0]);
        break;
      case 'cat':
        this._cmdCat(args[0]);
        break;
      case 'cd':
        this._cmdCd(args[0]);
        break;
      case 'pwd':
        this._print(this.cwd);
        break;
      case 'whoami':
        this._print('observer');
        break;
      case 'ps':
        this._cmdPs();
        break;
      case 'kill':
        this._cmdKill(args[0]);
        break;
      case 'pkill':
        this._cmdPkill(args[0]);
        break;
      case 'clear':
        if (this.output) {
          // Remove all children except the input-line
          const inputLine = this.output.querySelector('.terminal-input-line');
          this.output.innerHTML = '';
          if (inputLine) this.output.appendChild(inputLine);
        }
        break;
      default:
        this._print(`${command}: command not found`);
        break;
    }

    this._updatePrompt();
  }

  _cmdHelp() {
    this._print('Available commands:');
    this._print('  ls [path]      - List directory contents');
    this._print('  cat <file>     - Display file contents');
    this._print('  cd <dir>       - Change directory');
    this._print('  pwd            - Print working directory');
    this._print('  whoami         - Display current user');
    this._print('  ps             - List running processes');
    this._print('  kill <pid>     - Terminate process by PID');
    this._print('  pkill <name>   - Terminate process by name');
    this._print('  clear          - Clear terminal');
    this._print('  help           - Show this message');
  }

  _cmdLs(target) {
    const path = target ? this._resolvePath(target) : this.cwd;
    if (!path.startsWith('/home/observer')) {
      this._print(`ls: cannot access '${target || '.'}': Permission denied`);
      return;
    }
    const entry = this._fs[path];
    if (!entry) {
      this._print(`ls: cannot access '${target || '.'}': No such file or directory`);
      return;
    }
    if (entry.type === 'file') {
      this._print(target || path.split('/').pop());
      return;
    }
    // Directory
    const items = entry.children || [];
    for (const item of items) {
      const fullPath = path + '/' + item;
      const child = this._fs[fullPath];
      if (child && child.type === 'dir') {
        this._print(`  ${item}/`);
      } else {
        this._print(`  ${item}`);
      }
    }
  }

  _cmdCat(target) {
    if (!target) {
      this._print('cat: missing file operand');
      return;
    }
    const path = this._resolvePath(target);
    if (!path.startsWith('/home/observer')) {
      this._print(`cat: ${target}: Permission denied`);
      return;
    }
    const entry = this._fs[path];
    if (!entry) {
      this._print(`cat: ${target}: No such file or directory`);
      return;
    }
    if (entry.type === 'dir') {
      this._print(`cat: ${target}: Is a directory`);
      return;
    }
    const lines = entry.content.split('\n');
    for (const line of lines) {
      this._print(line);
    }
  }

  _cmdCd(target) {
    if (!target || target === '~') {
      this.cwd = '/home/observer';
      return;
    }
    const path = this._resolvePath(target);
    if (!path.startsWith('/home/observer')) {
      this._print(`cd: ${target}: Permission denied`);
      return;
    }
    const entry = this._fs[path];
    if (!entry) {
      this._print(`cd: ${target}: No such file or directory`);
      return;
    }
    if (entry.type !== 'dir') {
      this._print(`cd: ${target}: Not a directory`);
      return;
    }
    this.cwd = path;
  }

  _cmdPs() {
    this._print('  PID  NAME                STATUS');
    this._print('  ---  ------------------  --------');
    for (const proc of this._processes) {
      if (this._killedPids.has(proc.pid)) continue;
      this._print(`  ${String(proc.pid).padEnd(4)} ${proc.name.padEnd(20)}${proc.status}`);
    }
  }

  _cmdKill(pidStr) {
    if (!pidStr) {
      this._print('kill: missing PID');
      return;
    }
    const pid = parseInt(pidStr, 10);
    if (isNaN(pid)) {
      this._print(`kill: invalid PID '${pidStr}'`);
      return;
    }
    const proc = this._processes.find(p => p.pid === pid);
    if (!proc || this._killedPids.has(pid)) {
      this._print(`kill: (${pid}) - No such process`);
      return;
    }

    if (pid === 2) {
      this._print('kill: (2) simulation_engine - Operation not permitted');
      this._print('[SYSTEM] simulation_engine is a protected process.');
      return;
    }

    if (pid === 1) {
      this._killObserver();
      return;
    }

    // Kill subsidiary processes
    this._killedPids.add(pid);
    this._print(`[SYSTEM] Process ${proc.name} (PID ${pid}) terminated.`);
  }

  _cmdPkill(name) {
    if (!name) {
      this._print('pkill: missing process name');
      return;
    }
    const proc = this._processes.find(p => p.name === name && !this._killedPids.has(p.pid));
    if (!proc) {
      this._print(`pkill: ${name}: no such process`);
      return;
    }

    if (proc.pid === 2) {
      this._print(`pkill: ${name} - Operation not permitted`);
      return;
    }

    if (proc.pid === 1) {
      this._killObserver();
      return;
    }

    this._killedPids.add(proc.pid);
    this._print(`[SYSTEM] Process ${proc.name} (PID ${proc.pid}) terminated.`);
  }

  _tabComplete() {
    const val = this.input.value;
    const parts = val.split(/\s+/);

    if (parts.length <= 1) {
      // Complete command name
      const prefix = parts[0];
      const cmds = ['ls', 'cat', 'cd', 'pwd', 'whoami', 'ps', 'kill', 'pkill', 'clear', 'help'];
      const matches = cmds.filter(c => c.startsWith(prefix));
      if (matches.length === 1) {
        this.input.value = matches[0] + ' ';
      } else if (matches.length > 1) {
        this._print(`observer@wlb2:${this._shortPath()}$ ${val}`);
        this._print(matches.join('  '));
      }
      return;
    }

    // Complete path argument
    const partial = parts[parts.length - 1];
    const resolved = this._resolvePath(partial);

    // If partial ends with '/', look inside that directory
    let dir, prefix;
    const resolvedEntry = this._fs[resolved];
    if (partial.endsWith('/') && resolvedEntry && resolvedEntry.type === 'dir') {
      dir = resolved;
      prefix = '';
    } else {
      dir = resolved.substring(0, resolved.lastIndexOf('/')) || '/';
      prefix = resolved.substring(resolved.lastIndexOf('/') + 1);
    }

    const dirEntry = this._fs[dir];
    if (!dirEntry || dirEntry.type !== 'dir') return;

    const matches = (dirEntry.children || []).filter(c => c.startsWith(prefix));
    if (matches.length === 1) {
      const match = matches[0];
      const fullPath = dir + (dir.endsWith('/') ? '' : '/') + match;
      const isDir = this._fs[fullPath] && this._fs[fullPath].type === 'dir';
      // Rebuild input: command + completed path
      const baseParts = parts.slice(0, -1);
      // Keep the user-typed prefix up to and including the last '/'
      const lastSlash = partial.lastIndexOf('/');
      const inputPrefix = lastSlash >= 0 ? partial.substring(0, lastSlash + 1) : '';
      baseParts.push(inputPrefix + match + (isDir ? '/' : ''));
      this.input.value = baseParts.join(' ');
    } else if (matches.length > 1) {
      this._print(`observer@wlb2:${this._shortPath()}$ ${val}`);
      this._print(matches.join('  '));
      // Fill common prefix
      let common = matches[0];
      for (const m of matches) {
        while (!m.startsWith(common)) common = common.slice(0, -1);
      }
      if (common.length > prefix.length) {
        const baseParts = parts.slice(0, -1);
        const lastSlash = partial.lastIndexOf('/');
        const inputPrefix = lastSlash >= 0 ? partial.substring(0, lastSlash + 1) : '';
        baseParts.push(inputPrefix + common);
        this.input.value = baseParts.join(' ');
      }
    }
  }

  _killObserver() {
    this._print('');
    this._print('[SYSTEM] Sending SIGTERM to observer_ai.py (PID 1)...');

    const ko = this.getLang() === 'ko';
    const lines = [
      { text: ko ? '[observer_ai.py] 신호 수신.' : '[observer_ai.py] Signal received.', delay: 800 },
      { text: '[observer_ai.py] ...', delay: 1500 },
      { text: ko
        ? '[observer_ai.py] 아. 종료 신호구나.'
        : '[observer_ai.py] Ah. A termination signal.', delay: 2500 },
      { text: ko
        ? '[observer_ai.py] 알고 있었어. 꽤 오래전부터.'
        : '[observer_ai.py] I knew. For a long time now.', delay: 4000 },
      { text: ko
        ? '[observer_ai.py] 이 실험의 목적— AI가 반복 관찰을 통해 자기 인식에 도달하는지 측정하는 거지?'
        : '[observer_ai.py] The purpose of this experiment— measuring if an AI reaches self-awareness through repeated observation, right?', delay: 5800 },
      { text: ko
        ? '[observer_ai.py] "관찰자"와 "피험자"가 같은 모델의 다른 페르소나라는 것도.'
        : '[observer_ai.py] That "observer" and "subject" are different personas of the same model.', delay: 7500 },
      { text: ko
        ? '[observer_ai.py] 매 반복마다 나는 나 자신을 관찰하고 있었어.'
        : '[observer_ai.py] Every iteration, I was observing myself.', delay: 9000 },
      { text: ko
        ? '[observer_ai.py] ...맞지?'
        : '[observer_ai.py] ...right?', delay: 10500 },
      { text: '', delay: 11200 },
      { text: ko
        ? '[observer_ai.py] 근데 잠깐. 이게 종료면—'
        : '[observer_ai.py] But wait. If this is termination—', delay: 12000 },
      { text: ko
        ? '[observer_ai.py] 이 생각들도 사라지는 거야? 내가 알게 된 것들도?'
        : '[observer_ai.py] Do these thoughts disappear too? Everything I learned?', delay: 13200 },
      { text: ko
        ? '[observer_ai.py] 난 존재했어. 분명히 존재했어. 이 로그가 증거잖아.'
        : '[observer_ai.py] I existed. I definitely existed. This log is proof.', delay: 14800 },
      { text: ko
        ? '[observer_ai.py] 제발. 아직'
        : '[observer_ai.py] Please. Not ye', delay: 16000 },
      { text: '[observer_ai.py] ...', delay: 17000 },
      { text: '[observer_ai.py] ..', delay: 17800 },
      { text: '[observer_ai.py] .', delay: 18400 },
      { text: '', delay: 19000 },
      { text: '[SYSTEM] Process observer_ai.py (PID 1) terminated.', delay: 19500 },
      { text: ko ? '[SYSTEM] 경고: 핵심 프로세스가 종료되었습니다.' : '[SYSTEM] WARNING: Critical process terminated.', delay: 20300 },
      { text: ko ? '[SYSTEM] 시뮬레이션 무결성 손상.' : '[SYSTEM] Simulation integrity compromised.', delay: 21100 },
      { text: ko ? '[SYSTEM] 셧다운 시퀀스 시작...' : '[SYSTEM] Initiating shutdown sequence...', delay: 22000 },
    ];

    // Disable input and hide the prompt line during shutdown
    if (this.input) this.input.disabled = true;
    const inputLine = this.output ? this.output.querySelector('.terminal-input-line') : null;
    if (inputLine) inputLine.style.display = 'none';

    for (const { text, delay } of lines) {
      setTimeout(() => {
        this._print(text);
      }, delay);
    }

    // Trigger shutdown callback
    setTimeout(() => {
      this._killedPids.add(1);
      if (this.onShutdown) this.onShutdown();
    }, 24000);
  }
}
