import "./DeskBackground.css"

export default function DeskBackground() {
  return (
    <div className="desk-bg-root">
      <div className="desk">
        <div className="paper-area" />

        <div className="coffee">
          <div className="coffee-inner" />
          <div className="coffee-handle" />
        </div>

        <div className="recorder">
          <div className="recorder-top" />
          <div className="recorder-button red" />
          <div className="recorder-button" />
          <div className="recorder-button" />
        </div>

        <div className="folder">
          <div className="folder-tab" />
          <div className="stamp">TOP SECRET</div>
          <p>• TEST DESIGN</p>
          <p>• COVERAGE</p>
          <p>• EVIDENCE</p>
        </div>

        <div className="paperclip" />

        <div className="pencil">
          <div className="pencil-body" />
          <div className="pencil-tip" />
          <div className="pencil-eraser" />
        </div>

        <div className="floppy">
          <div className="floppy-metal" />
          <div className="floppy-slot" />
          <div className="floppy-label" />
        </div>
      </div>
    </div>
  )
}
