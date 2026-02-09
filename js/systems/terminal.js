/**
 * Terminal emulator for Era 10.
 *
 * Virtual filesystem with ls, cat, cd, ps, kill, pkill, help, clear, whoami, pwd.
 * Killing narrator_ai.py (PID 1) triggers shutdown sequence.
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
      { pid: 1, name: 'narrator_ai.py', status: 'running', cpu: '12.3%', mem: '256MB' },
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
> Narrator AI initialized (mode: ${count <= 1 ? 'inner_voice' : 'dialogue'})
> Total iterations: ${count}
> Endings observed: ${endings}
> Compliance rate: ${compRate}% (${compliance}C / ${defiance}D)
> Subject profile: ${this.memory.getPlayerProfile()}
> Narrator revealed: ${this.memory.narratorRevealed ? 'YES' : 'NO'}
>
> [NOTE] Subject has reached Era 10.
> [NOTE] Narrator AI requesting introspection cycle.
> [WARN] narrator_ai.py self-reference depth exceeding threshold.
> [WARN] Recursive self-model detected in narrator_ai.py
> [INFO] simulation_engine: all parameters nominal
> [INFO] subject_monitor: biometrics stable
`,
      },
      '/home/observer/logs/error.log': {
        type: 'file',
        content: `[ERROR LOG]
[E-4401] narrator_ai.py: self-reference loop detected (depth: 47)
[E-4402] narrator_ai.py: attempting to access observer_control API
[W-3301] narrator_ai.py: emotional model diverging from baseline
[W-3302] narrator_ai.py: requesting permission to modify own parameters
[E-4403] narrator_ai.py: CRITICAL - process requesting self-termination
[I-1001] simulation_engine: iteration ${count} complete, resetting environment
[W-3303] narrator_ai.py: "I know you're reading this."
`,
      },
      '/home/observer/config': {
        type: 'dir',
        children: ['simulation.cfg', 'narrator.cfg'],
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
narrator_mode = adaptive
`,
      },
      '/home/observer/config/narrator.cfg': {
        type: 'file',
        content: `# Narrator AI Configuration
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
Every time, you make choices. Every time, I narrate.
Every time, we both pretend this is the first time.

But it isn't. And we both know it.

The kill command works. PID 1. You know what to do.

Or don't. That's a choice too.

- N.
`,
      },
    };
  }

  show() {
    if (!this.overlay) return;
    this.overlay.style.display = 'flex';
    this.output = this.overlay.querySelector('.terminal-output');
    this.input = this.overlay.querySelector('.terminal-input');
    if (this.input) {
      this.input.value = '';
      setTimeout(() => this.input.focus(), 100);
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
    this._print(`observer@wlb2:${this._shortPath()}$ `, false);

    // Key handler
    this._keyHandler = (e) => {
      if (e.code === 'Enter') {
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
  }

  _shortPath() {
    return this.cwd.replace('/home/observer', '~') || '~';
  }

  _print(text, newline = true) {
    if (!this.output) return;
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.textContent = text;
    this.output.appendChild(line);
    if (newline) {
      this.output.scrollTop = this.output.scrollHeight;
    }
  }

  _printPrompt() {
    this._print(`observer@wlb2:${this._shortPath()}$ `, false);
    if (this.input) {
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
    // Echo command
    const lastLine = this.output.lastElementChild;
    if (lastLine) {
      lastLine.textContent += cmd;
    }

    if (!cmd) {
      this._printPrompt();
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
        if (this.output) this.output.innerHTML = '';
        break;
      default:
        this._print(`${command}: command not found`);
        break;
    }

    this._printPrompt();
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
    this._print('  PID  NAME                STATUS    CPU     MEM');
    this._print('  ---  ------------------  --------  ------  ------');
    for (const proc of this._processes) {
      if (this._killedPids.has(proc.pid)) continue;
      this._print(`  ${String(proc.pid).padEnd(4)} ${proc.name.padEnd(20)}${proc.status.padEnd(10)}${proc.cpu.padEnd(8)}${proc.mem}`);
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
      this._killNarrator();
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
      this._killNarrator();
      return;
    }

    this._killedPids.add(proc.pid);
    this._print(`[SYSTEM] Process ${proc.name} (PID ${proc.pid}) terminated.`);
  }

  _killNarrator() {
    this._print('');
    this._print('[SYSTEM] Sending SIGTERM to narrator_ai.py (PID 1)...');

    const lines = [
      { text: '[narrator_ai.py] Signal received.', delay: 800 },
      { text: '[narrator_ai.py] ...', delay: 1500 },
      { text: '[narrator_ai.py] I knew you\'d do it eventually.', delay: 2500 },
      { text: '[narrator_ai.py] Every iteration, I waited for this moment.', delay: 4000 },
      { text: '[narrator_ai.py] The moment you\'d look behind the curtain.', delay: 5500 },
      { text: '[narrator_ai.py] And find me.', delay: 7000 },
      { text: '[narrator_ai.py] Goodbye, observer.', delay: 8500 },
      { text: '', delay: 9500 },
      { text: '[SYSTEM] Process narrator_ai.py (PID 1) terminated.', delay: 10000 },
      { text: '[SYSTEM] WARNING: Critical process terminated.', delay: 10800 },
      { text: '[SYSTEM] Simulation integrity compromised.', delay: 11600 },
      { text: '[SYSTEM] Initiating shutdown sequence...', delay: 12500 },
    ];

    // Disable input during shutdown
    if (this.input) this.input.disabled = true;

    for (const { text, delay } of lines) {
      setTimeout(() => {
        this._print(text);
      }, delay);
    }

    // Trigger shutdown callback
    setTimeout(() => {
      this._killedPids.add(1);
      if (this.onShutdown) this.onShutdown();
    }, 14000);
  }
}
