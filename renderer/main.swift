// petdex-renderer — native macOS desktop-pet overlay for DSH.
//
//   - transparent, borderless, always-on-top window
//   - polls GET /petdex-market/desktop from the DSH web server for the active
//     pet, sprite URL, real frame geometry, scale, liveliness, bubble flag,
//     and the latest agent-activity state
//   - animates the petdex spritesheet (directional running rows, per-state
//     frame counts and durations from petdex.dev's canonical spec)
//   - autonomous walker: wanders along the bottom of the primary screen,
//     bounces at margins, walk/pause phases driven by liveliness
//   - drag support (freeze 3s after), right-click menu (Disable/Reload/Quit)
//   - speech bubble on session completion (respects bubbleEnabled)
//
// Exits by itself when desktopEnabled=false or no active pet exists.

import AppKit
import Foundation

// MARK: - Config

struct ActivityInfo: Codable {
    let state: String?
    let at: Double?
    let bubble: String?
}

struct ActivePet: Codable {
    let id: String
    let displayName: String
    let spriteSrc: String
    let frameWidth: Double
    let frameHeight: Double
    let cols: Double
    let rows: Double
}

struct DesktopConfig: Codable {
    let desktopEnabled: Bool?
    let activePet: ActivePet?
    let petScale: Double?
    let petLiveliness: Double?
    let bubbleEnabled: Bool?
    let activity: ActivityInfo?
}

// MARK: - Geometry / timing defaults (petdex.dev spec)

let DEFAULT_FW: CGFloat = 192
let DEFAULT_FH: CGFloat = 208
let DEFAULT_COLS = 8
let FRAMES_PER_STATE = 6
let LOOP_MS: TimeInterval = 1.1
let MIN_SCALE: CGFloat = 0.4
let MAX_SCALE: CGFloat = 2.5
let STEP: CGFloat = 2
let MARGIN: CGFloat = 24

enum PetState: String, CaseIterable {
    case idle, runningRight, runningLeft, waving, jumping, failed, waiting, running, review
    var row: Int {
        PetState.allCases.firstIndex(of: self) ?? 0
    }
    /// Frames in this state's row (petdex.dev canonical).
    var frames: Int {
        switch self {
        case .idle: return 6
        case .runningRight, .runningLeft: return 8
        case .waving: return 4
        case .jumping: return 5
        case .failed: return 8
        case .waiting: return 6
        case .running: return 6
        case .review: return 6
        }
    }
    /// Loop duration for this state's row, ms (petdex.dev canonical).
    var loopMs: TimeInterval {
        switch self {
        case .idle: return 1.100
        case .runningRight, .runningLeft: return 1.060
        case .waving: return 0.700
        case .jumping: return 0.840
        case .failed: return 1.220
        case .waiting: return 1.010
        case .running: return 0.820
        case .review: return 1.030
        }
    }
}

func randRange(_ min: Int, _ max: Int) -> Int {
    Int.random(in: min...max)
}

// MARK: - Pet view

final class PetView: NSView {
    var sprite: NSImage?
    var fw: CGFloat = DEFAULT_FW
    var fh: CGFloat = DEFAULT_FH
    var cols: Int = DEFAULT_COLS
    var state: PetState = .idle
    var frameIndex: Int = 0

    var onDragStart: (() -> Void)?
    var onDragEnd: (() -> Void)?
    var onContextMenu: (() -> Void)?
    private var dragging = false

    override func draw(_ dirtyRect: NSRect) {
        guard let sprite = sprite, let cg = sprite.cgImage(forProposedRect: nil, context: nil, hints: nil) else { return }
        guard let ctx = NSGraphicsContext.current?.cgContext else { return }
        ctx.clear(bounds)

        let row = state.row
        let col = frameIndex % max(1, cols)
        let sx = CGFloat(col) * fw
        let sy = CGFloat(row) * fh
        // CGImage cropping uses the image's own pixel space; top-left origin
        // matches the petdex sheet layout (row 0 = idle at top).
        guard let crop = cg.cropping(to: CGRect(x: sx, y: sy, width: fw, height: fh)) else { return }

        // Directional states are separate art rows (running-right / running-left),
        // so no mirroring is needed — the sprite always draws as-is.
        ctx.draw(crop, in: bounds)
    }

    // Drag: performDrag lets AppKit move the borderless window natively until
    // the mouse is released.
    override func mouseDown(with event: NSEvent) {
        dragging = true
        onDragStart?()
        window?.performDrag(with: event)
        // performDrag runs its own event loop and returns on mouse-up.
        if dragging {
            dragging = false
            onDragEnd?()
        }
    }
    override func mouseUp(with event: NSEvent) {
        if dragging {
            dragging = false
            onDragEnd?()
        }
    }
    override func rightMouseDown(with event: NSEvent) {
        onContextMenu?()
    }
}

final class BubbleView: NSView {
    var text: String = "" { didSet { needsDisplay = true } }
    private let attrs: [NSAttributedString.Key: Any] = [
        .font: NSFont.systemFont(ofSize: 13),
        .foregroundColor: NSColor.white,
    ]
    var maxWidth: CGFloat = 220
    /// Max lines shown; overflow truncates with an ellipsis (2-line clamp).
    private let maxLines = 2

    private var lineHeight: CGFloat {
        ("Ag" as NSString).boundingRect(
            with: NSSize(width: maxWidth - 20, height: .greatestFiniteMagnitude),
            options: [.usesLineFragmentOrigin, .usesFontLeading],
            attributes: attrs).height
    }

    /// Bubble size clamped to 2 lines so the rounded background always fits
    /// inside the fixed 52pt strip (no clipped corners).
    func bubbleSize() -> NSSize {
        guard !text.isEmpty else { return .zero }
        let rect = (text as NSString).boundingRect(
            with: NSSize(width: maxWidth - 20, height: .greatestFiniteMagnitude),
            options: [.usesLineFragmentOrigin, .usesFontLeading],
            attributes: attrs)
        let textH = min(rect.height, lineHeight * CGFloat(maxLines))
        return NSSize(width: min(rect.width + 20, maxWidth), height: textH + 12)
    }

    override func draw(_ dirtyRect: NSRect) {
        guard !text.isEmpty else { return }
        let size = bubbleSize()
        let rect = NSRect(x: (bounds.width - size.width) / 2, y: 0, width: size.width, height: size.height)
        let path = NSBezierPath(roundedRect: rect, xRadius: 10, yRadius: 10)
        NSColor(calibratedWhite: 0.08, alpha: 0.92).setFill()
        path.fill()
        let textRect = rect.insetBy(dx: 10, dy: 6)
        (text as NSString).draw(
            with: textRect,
            options: [.usesLineFragmentOrigin, .usesFontLeading, .truncatesLastVisibleLine],
            attributes: attrs)
    }
}

// MARK: - App delegate

final class PetApp: NSObject, NSApplicationDelegate {
    private var window: NSWindow?
    private var petView: PetView?
    private var bubbleView: BubbleView?
    private var pendingBubble: String? = nil
    private var server: URL
    private var scale: CGFloat = 1
    private var liveliness: Double = 0.6
    private var bubbleEnabled = true
    private var currentPetKey: String? = nil

    private var animTimer: Timer?
    private var walkTimer: Timer?
    private var pollTimer: Timer?
    private var lastFrameTs: TimeInterval = 0

    // walker phase state
    private var phase: String = "walk"
    private var nextPhaseAt: TimeInterval = 0
    private var direction: Int = 1
    private var jumping = false
    private var jumpEndAt: TimeInterval = 0
    private var jumpAt: TimeInterval = 0
    private var freezeUntil: TimeInterval = 0
    private var dragging = false

    // activity overrides (from agent sessions)
    private var runOverrideUntil: TimeInterval = 0
    private var waveOverrideUntil: TimeInterval = 0
    private var lastActivityAt: Double = 0
    private var bubbleTimer: Timer?

    init(server: URL) {
        self.server = server
        super.init()
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        pollTimer = Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { [weak self] _ in
            self?.pollConfig()
        }
        pollConfig()
    }

    func applicationWillTerminate(_ notification: Notification) {
        animTimer?.invalidate()
        walkTimer?.invalidate()
        pollTimer?.invalidate()
    }

    // MARK: polling

    private func pollConfig() {
        var req = URLRequest(url: server.appendingPathComponent("petdex-market/desktop"))
        req.cachePolicy = .reloadIgnoringLocalCacheData
        req.timeoutInterval = 5
        URLSession.shared.dataTask(with: req) { [weak self] data, resp, err in
            guard let self = self else { return }
            guard let data = data,
                  let cfg = try? JSONDecoder().decode(DesktopConfig.self, from: data) else {
                if err != nil { print("poll failed: \(err!.localizedDescription)") }
                return
            }
            DispatchQueue.main.async { self.applyConfig(cfg) }
        }.resume()
    }

    private func applyConfig(_ cfg: DesktopConfig) {
        if cfg.desktopEnabled == false || cfg.activePet == nil {
            print("desktop disabled or no active pet — exiting")
            NSApp.terminate(nil)
            return
        }
        guard let pet = cfg.activePet else { return }
        scale = min(MAX_SCALE, max(MIN_SCALE, CGFloat(cfg.petScale ?? 1)))
        liveliness = min(1, max(0, cfg.petLiveliness ?? 0.6))
        bubbleEnabled = cfg.bubbleEnabled ?? true

        let key = "\(pet.id)@\(scale)"
        if currentPetKey != key {
            currentPetKey = key
            loadSprite(pet: pet)
        }

        applyActivity(cfg.activity)
    }

    private func applyActivity(_ act: ActivityInfo?) {
        guard let act = act, let at = act.at, at > lastActivityAt else { return }
        lastActivityAt = at
        switch act.state {
        case "run":
            runOverrideUntil = Date.timeIntervalSinceReferenceDate + 45
        case "wave":
            waveOverrideUntil = Date.timeIntervalSinceReferenceDate + 3
            runOverrideUntil = 0
            if bubbleEnabled, let text = act.bubble, !text.isEmpty {
                showBubble(text)
            }
        default:
            break
        }
    }

    private func loadSprite(pet: ActivePet) {
        print("loading sprite: \(pet.spriteSrc)")
        guard let url = URL(string: pet.spriteSrc) else { return }
        URLSession.shared.dataTask(with: url) { [weak self] data, _, err in
            guard let self = self, let data = data, let img = NSImage(data: data) else {
                if err != nil { print("sprite download failed: \(err!.localizedDescription)") }
                return
            }
            DispatchQueue.main.async { self.applySprite(img, pet: pet) }
        }.resume()
    }

    private func applySprite(_ img: NSImage, pet: ActivePet) {
        let fw = CGFloat(pet.frameWidth > 0 ? pet.frameWidth : DEFAULT_FW)
        let fh = CGFloat(pet.frameHeight > 0 ? pet.frameHeight : DEFAULT_FH)
        let cols = max(1, Int(pet.cols > 0 ? pet.cols : Double(DEFAULT_COLS)))

        // Pet canvas keeps its EXACT aspect (fw*scale × fh*scale); the window
        // only adds a bubble strip on top. Width is widened to at least 240pt
        // so speech bubbles never get clipped at the window edges.
        let petW = max(1, fw * scale)
        let petH = max(1, fh * scale)
        let bubbleH: CGFloat = 52
        let winW = max(petW, 240)
        resizeWindow(petW: petW, petH: petH, winW: winW, winH: petH + bubbleH)

        guard let petView = petView else { return }
        petView.sprite = img
        petView.fw = fw
        petView.fh = fh
        petView.cols = cols
        petView.needsDisplay = true

        // Flush a bubble that arrived before the window existed, else greet.
        if let pending = pendingBubble {
            pendingBubble = nil
            showBubble(pending)
        } else {
            showBubble(pet.displayName.isEmpty ? "Hello!" : "Hi, I'm \(pet.displayName)")
        }
    }

    // MARK: window management

    private func ensureWindow(petW: CGFloat, petH: CGFloat, winW: CGFloat, winH: CGFloat) {
        if window == nil {
            let win = NSWindow(
                contentRect: NSRect(x: 0, y: 0, width: winW, height: winH),
                styleMask: [.borderless],
                backing: .buffered,
                defer: false)
            win.isOpaque = false
            win.backgroundColor = .clear
            win.hasShadow = false
            win.level = .floating
            win.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
            win.ignoresMouseEvents = false
            win.isMovableByWindowBackground = false

            let pv = PetView(frame: NSRect(x: (winW - petW) / 2, y: 0, width: petW, height: petH))
            pv.onDragStart = { [weak self] in self?.dragging = true }
            pv.onDragEnd = { [weak self] in self?.endDrag() }
            pv.onContextMenu = { [weak self] in self?.showMenu() }
            petView = pv

            let bv = BubbleView(frame: NSRect(x: 0, y: petH, width: winW, height: 52))
            bv.text = ""
            bv.maxWidth = winW
            bubbleView = bv

            let content = NSView(frame: NSRect(x: 0, y: 0, width: winW, height: winH))
            content.addSubview(pv)
            content.addSubview(bv)
            win.contentView = content
            window = win

            // Start near the bottom-right of the primary screen.
            if let screen = NSScreen.main {
                let vf = screen.visibleFrame
                let origin = NSPoint(x: vf.maxX - winW - 60, y: vf.minY + 8)
                win.setFrameOrigin(origin)
            }
            win.orderFrontRegardless()
            startAnimation()
            startWalker()
        }
    }

    private func resizeWindow(petW: CGFloat, petH: CGFloat, winW: CGFloat, winH: CGFloat) {
        ensureWindow(petW: petW, petH: petH, winW: winW, winH: winH)
        guard let win = window else { return }
        let frame = win.frame
        let newFrame = NSRect(x: frame.origin.x, y: frame.origin.y, width: winW, height: winH)
        win.setFrame(newFrame, display: true)

        // Pet stays centered horizontally at the bottom, exact aspect; the
        // bubble strip occupies the full window width above it.
        petView?.frame = NSRect(x: (winW - petW) / 2, y: 0, width: petW, height: petH)
        bubbleView?.frame = NSRect(x: 0, y: petH, width: winW, height: 52)
        bubbleView?.maxWidth = winW
        petView?.needsDisplay = true
    }

    // MARK: animation loop (per-state frames/duration, petdex.dev canonical)

    private func startAnimation() {
        animTimer?.invalidate()
        lastFrameTs = 0
        animTimer = Timer.scheduledTimer(withTimeInterval: 1.0 / 30.0, repeats: true) { [weak self] _ in
            guard let self = self, let petView = self.petView else { return }
            let now = Date.timeIntervalSinceReferenceDate
            if self.lastFrameTs == 0 { self.lastFrameTs = now }
            self.updateState()
            let state = petView.state
            let interval = state.loopMs / Double(max(1, state.frames))
            if now - self.lastFrameTs >= interval {
                self.lastFrameTs = now
                petView.frameIndex = (petView.frameIndex + 1) % max(1, state.frames)
                petView.needsDisplay = true
            }
        }
    }

    /// Display state priority: waving > running (agent busy) > walker state.
    private func updateState() {
        guard let petView = petView else { return }
        let now = Date.timeIntervalSinceReferenceDate
        if now < waveOverrideUntil {
            petView.state = .waving
        } else if now < runOverrideUntil {
            petView.state = .running
        } else if jumping {
            petView.state = .jumping
        } else if phase == "walk" {
            // Directional locomotion rows: the art itself faces the direction.
            petView.state = (direction == 1) ? .runningRight : .runningLeft
        } else {
            petView.state = .idle
        }
    }

    // MARK: walker

    private func livelinessPauseRange() -> (Int, Int) {
        let l = liveliness
        let min = Int(600 + Double(12000 - 600) * (1 - l))
        let max = Int(1800 + Double(40000 - 1800) * (1 - l))
        return (min, max)
    }
    private func livelinessWalkRange() -> (Int, Int) {
        let l = liveliness
        let min = Int(600 + Double(4000 - 600) * l)
        let max = Int(2200 + Double(9000 - 2200) * l)
        return (min, max)
    }

    private func beginPause() {
        phase = "pause"
        let (mn, mx) = livelinessPauseRange()
        // randRange yields milliseconds; the walker clock is in seconds.
        nextPhaseAt = Date.timeIntervalSinceReferenceDate + Double(randRange(mn, mx)) / 1000.0
    }
    private func beginWalk() {
        phase = "walk"
        let (mn, mx) = livelinessWalkRange()
        nextPhaseAt = Date.timeIntervalSinceReferenceDate + Double(randRange(mn, mx)) / 1000.0
    }

    private func startWalker() {
        walkTimer?.invalidate()
        jumping = false
        jumpAt = Date.timeIntervalSinceReferenceDate + Double(randRange(8000, 16000)) / 1000.0
        beginWalk()
        walkTimer = Timer.scheduledTimer(withTimeInterval: 0.04, repeats: true) { [weak self] _ in
            self?.walkerTick()
        }
    }

    private func walkerTick() {
        guard let win = window, !dragging else { return }
        let now = Date.timeIntervalSinceReferenceDate

        if now < freezeUntil { petView?.state = .idle; return }

        // liveliness 0 = completely still: never initiate a walk. When
        // liveliness rises again, re-arm the phase clock from a pause.
        if liveliness <= 0 {
            phase = "pause"
            nextPhaseAt = .greatestFiniteMagnitude
            petView?.state = .idle
            return
        }
        if phase == "pause" && nextPhaseAt == .greatestFiniteMagnitude {
            beginPause()
            return
        }

        // Occasional hop (only when lively enough).
        if !jumping && liveliness > 0.3 && phase == "walk" && now >= jumpAt {
            jumping = true
            jumpEndAt = now + 0.9
        } else if jumping && now >= jumpEndAt {
            jumping = false
            jumpAt = now + Double(randRange(8000, 16000)) / 1000.0
        }
        if jumping { return }

        if phase == "pause" {
            if now >= nextPhaseAt { beginWalk() }
            return
        }

        // phase == "walk"
        if now >= nextPhaseAt { beginPause(); return }

        guard let screen = NSScreen.main else { return }
        let vf = screen.visibleFrame
        let width = win.frame.width
        let maxX = vf.maxX - width - MARGIN
        var nx = win.frame.origin.x + CGFloat(direction) * STEP
        if nx <= vf.minX + MARGIN {
            nx = vf.minX + MARGIN
            direction = 1
        } else if nx >= maxX {
            nx = maxX
            direction = -1
        }
        win.setFrameOrigin(NSPoint(x: nx, y: win.frame.origin.y))
    }

    private func endDrag() {
        dragging = false
        freezeUntil = Date.timeIntervalSinceReferenceDate + 3
        startWalker()
    }

    // MARK: bubble

    private func showBubble(_ text: String) {
        guard bubbleEnabled else { return }
        guard let bubbleView = bubbleView else {
            // Window not created yet (sprite still loading) — keep for later.
            pendingBubble = text
            return
        }
        bubbleView.text = text
        bubbleView.needsDisplay = true
        bubbleTimer?.invalidate()
        bubbleTimer = Timer.scheduledTimer(withTimeInterval: 4.2, repeats: false) { [weak self] _ in
            self?.bubbleView?.text = ""
            self?.bubbleView?.needsDisplay = true
        }
    }

    // MARK: context menu

    private func showMenu() {
        guard let win = window, let petView = petView else { return }
        let menu = NSMenu()
        menu.addItem(withTitle: "Disable Pet", action: #selector(menuDisable), keyEquivalent: "")
        menu.addItem(withTitle: "Reload", action: #selector(menuReload), keyEquivalent: "")
        menu.addItem(NSMenuItem.separator())
        menu.addItem(withTitle: "Quit", action: #selector(menuQuit), keyEquivalent: "q")
        menu.items.forEach { $0.target = self }
        let point = NSEvent.mouseLocation
        menu.popUp(positioning: nil, at: NSPoint(x: point.x - win.frame.origin.x, y: point.y - win.frame.origin.y), in: petView)
    }

    @objc private func menuDisable() {
        var req = URLRequest(url: server.appendingPathComponent("petdex-market/desktop"))
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "content-type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: ["enabled": false])
        URLSession.shared.dataTask(with: req).resume()
        NSApp.terminate(nil)
    }

    @objc private func menuReload() {
        currentPetKey = nil
        pollConfig()
    }

    @objc private func menuQuit() {
        NSApp.terminate(nil)
    }
}

// MARK: - entry

let args = CommandLine.arguments
var serverURL = URL(string: "http://127.0.0.1:3080")!
if let i = args.firstIndex(of: "--server"), i + 1 < args.count {
    if let u = URL(string: args[i + 1]) { serverURL = u }
}
print("petdex-renderer starting, server=\(serverURL.absoluteString)")

let app = NSApplication.shared
let delegate = PetApp(server: serverURL)
app.delegate = delegate
app.run()
