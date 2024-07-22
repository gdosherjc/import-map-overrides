import { h, Component } from "preact";

export default class ModuleTable extends Component {
  render() {
    return (
      <table className="imo-overrides-table">
        <thead>
          <tr>
            <th>Module Status</th>
            <th>Module Name</th>
            <th>Domain</th>
            <th>Filename</th>
          </tr>
        </thead>
        <tbody>
          {this.props.nextOverriddenModules.map((mod) => (
            <tr
              role="button"
              tabIndex={0}
              onClick={() => this.props.onClickRow(mod)}
              key={mod.moduleName}
            >
              <td onClick={this.reload} role="button" tabIndex={0}>
                <div className="imo-status imo-next-override" />
                <div>Inline Override</div>
                <div className="imo-needs-refresh" />
              </td>
              <td>{mod.moduleName}</td>
              <td>{toDomain(mod)}</td>
              <td>{toFileName(mod)}</td>
            </tr>
          ))}
          {this.props.pendingRefreshDefaultModules.map((mod) => (
            <tr
              role="button"
              tabIndex={0}
              onClick={() => this.props.onClickRow(mod)}
              key={mod.moduleName}
            >
              <td style={{ position: "relative" }}>
                <div className="imo-status imo-next-default" />
                <div>Default</div>
                <div className="imo-needs-refresh" />
              </td>
              <td>{mod.moduleName}</td>
              <td>{toDomain(mod)}</td>
              <td>{toFileName(mod)}</td>
            </tr>
          ))}
          {this.props.disabledOverrides.map((mod) => (
            <tr
              role="button"
              tabIndex={0}
              onClick={() => this.props.onClickRow(mod)}
              key={mod.moduleName}
            >
              <td>
                <div className="imo-status imo-disabled-override" />
                <div>Override disabled</div>
              </td>
              <td>{mod.moduleName}</td>
              <td>{toDomain(mod)}</td>
              <td>{toFileName(mod)}</td>
            </tr>
          ))}
          {this.props.overriddenModules.map((mod) => (
            <tr
              role="button"
              tabIndex={0}
              onClick={() => this.props.onClickRow(mod)}
              key={mod.moduleName}
            >
              <td>
                <div className="imo-status imo-current-override" />
                <div>Inline Override</div>
              </td>
              <td>{mod.moduleName}</td>
              <td>{toDomain(mod)}</td>
              <td>{toFileName(mod)}</td>
            </tr>
          ))}
          {this.props.externalOverrideModules.map((mod) => (
            <tr
              role="button"
              tabIndex={0}
              onClick={() => this.props.onClickRow(mod)}
              key={mod.moduleName}
            >
              <td>
                <div className="imo-status imo-external-override" />
                <div>External Override</div>
              </td>
              <td>{mod.moduleName}</td>
              <td>{toDomain(mod)}</td>
              <td>{toFileName(mod)}</td>
            </tr>
          ))}
          {this.props.devLibModules.map((mod) => (
            <tr
              role="button"
              tabIndex={0}
              onClick={() => this.props.onClickRow(mod)}
              key={mod.moduleName}
              title="Automatically use dev version of certain npm libs"
            >
              <td>
                <div className="imo-status imo-dev-lib-override" />
                <div>Dev Lib Override</div>
              </td>
              <td>{mod.moduleName}</td>
              <td>{toDomain(mod)}</td>
              <td>{toFileName(mod)}</td>
            </tr>
          ))}
          {this.props.defaultModules.map((mod) => (
            <tr
              role="button"
              tabIndex={0}
              onClick={() => this.props.onClickRow(mod)}
              key={mod.moduleName}
            >
              <td>
                <div className="imo-status imo-default-module" />
                <div>Default</div>
              </td>
              <td>{mod.moduleName}</td>
              <td>{toDomain(mod)}</td>
              <td>{toFileName(mod)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }
}

const currentBase =
  (document.querySelector("base") && document.querySelector("base").href) ||
  location.origin + "/";

function toDomain(mod) {
  const urlStr = toUrlStr(mod);
  const url = toURL(urlStr);
  return url ? url.host : urlStr;
}

function toFileName(mod) {
  const urlStr = toUrlStr(mod);
  const url = toURL(urlStr);
  return url ? url.pathname.slice(url.pathname.lastIndexOf("/") + 1) : urlStr;
}

function toUrlStr(mod) {
  return mod.overrideUrl || mod.defaultUrl;
}

function toURL(urlStr) {
  try {
    return new URL(urlStr, currentBase);
  } catch {
    return null;
  }
}