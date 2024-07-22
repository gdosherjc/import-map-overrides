import { h, Component, render } from "preact";
import { includes } from "../../util/includes.js";
import ModuleDialog from "./module-dialog.component";
import ExternalImportMap from "./external-importmap-dialog.component";
import { devLibs } from "../dev-lib-overrides.component";
import ModuleTable from "./module-table.component.js";
import { expandRelativeUrlsInImportMap } from '../../api/js-api.js';

const stagingUrl = "https://console.stg01.jumpcloud.com/importmap.json";
const prodUrl = "https://console.jumpcloud.com/importmap.json"

export default class List extends Component {
  state = {
    notOverriddenMap: { imports: {} },
    currentPageMap: { imports: {} },
    nextPageMap: { imports: {} },
    dialogModule: null,
    dialogExternalMap: null,
    searchVal: "",
    stagingMap: { imports: {} },
    prodMap: { imports: {} },
    prMap: { imports: {} },
  };
  componentDidMount() {
    window.importMapOverrides.getDefaultMap().then((notOverriddenMap) => {
      this.setState({ notOverriddenMap });
    });
    window.importMapOverrides.getCurrentPageMap().then((currentPageMap) => {
      this.setState({ currentPageMap });
    });
    window.importMapOverrides.getNextPageMap().then((nextPageMap) => {
      this.setState({ nextPageMap });
    });
    window.addEventListener("import-map-overrides:change", this.doUpdate);
    this.inputRef.focus();
    this.fetchMap(stagingUrl).then((stagingMap) => {
      this.setState({ stagingMap });
    });
    this.fetchMap(prodUrl).then((prodMap) => {
      this.setState({ prodMap });
    });
  }
  componentWillUnmount() {
    window.removeEventListener("import-map-overrides:change", this.doUpdate);
  }
  componentDidUpdate(prevProps, prevState) {
    if (!prevState.dialogModule && this.state.dialogModule) {
      this.dialogContainer = document.createElement("div");
      document.body.appendChild(this.dialogContainer);
      render(
        <ModuleDialog
          module={this.state.dialogModule}
          cancel={this.cancel}
          updateModuleUrl={this.updateModuleUrl}
          addNewModule={this.addNewModule}
        />,
        this.dialogContainer
      );
    } else if (prevState.dialogModule && !this.state.dialogModule) {
      render(null, this.dialogContainer);
      this.dialogContainer.remove();
      delete this.dialogContainer;
    }

    if (!prevState.dialogExternalMap && this.state.dialogExternalMap) {
      this.dialogContainer = document.createElement("div");
      document.body.appendChild(this.dialogContainer);
      render(
        <ExternalImportMap
          dialogExternalMap={this.state.dialogExternalMap}
          cancel={this.cancel}
        />,
        this.dialogContainer
      );
    } else if (prevState.dialogExternalMap && !this.state.dialogExternalMap) {
      render(null, this.dialogContainer);
      this.dialogContainer.remove();
      delete this.dialogContainer;
    }
  }
  render() {
    const overriddenModules = [],
      nextOverriddenModules = [],
      disabledOverrides = [],
      defaultModules = [],
      externalOverrideModules = [],
      pendingRefreshDefaultModules = [],
      devLibModules = [];

    const overrideMap = window.importMapOverrides.getOverrideMap(true).imports;

    const notOverriddenKeys = Object.keys(this.state.notOverriddenMap.imports);

    const disabledModules = window.importMapOverrides.getDisabledOverrides();

    notOverriddenKeys.filter(this.filterModuleNames).forEach((moduleName) => {
      const mod = {
        moduleName,
        defaultUrl: this.state.notOverriddenMap.imports[moduleName],
        overrideUrl: overrideMap[moduleName],
        disabled: includes(disabledModules, moduleName),
      };
      if (mod.disabled) {
        disabledOverrides.push(mod);
      } else if (overrideMap[moduleName]) {
        if (
          this.state.currentPageMap.imports[moduleName] ===
          overrideMap[moduleName]
        ) {
          if (
            devLibs[moduleName] &&
            devLibs[moduleName](
              this.state.currentPageMap.imports[moduleName]
            ) === overrideMap[moduleName]
          ) {
            devLibModules.push(mod);
          } else {
            overriddenModules.push(mod);
          }
        } else {
          nextOverriddenModules.push(mod);
        }
      } else if (
        this.state.notOverriddenMap.imports[moduleName] ===
        this.state.currentPageMap.imports[moduleName]
      ) {
        defaultModules.push(mod);
      } else if (
        this.state.notOverriddenMap.imports[moduleName] ===
        this.state.nextPageMap.imports[moduleName]
      ) {
        pendingRefreshDefaultModules.push(mod);
      } else {
        externalOverrideModules.push({
          ...mod,
          overrideUrl: this.state.currentPageMap.imports[moduleName],
        });
      }
    });

    Object.keys(overrideMap)
      .filter(this.filterModuleNames)
      .forEach((moduleName) => {
        if (!includes(notOverriddenKeys, moduleName)) {
          const mod = {
            moduleName,
            defaultUrl: null,
            overrideUrl: overrideMap[moduleName],
            disabled: includes(disabledModules, moduleName),
          };

          if (mod.disabled) {
            disabledOverrides.push(mod);
          } else if (
            this.state.currentPageMap.imports[moduleName] ===
            overrideMap[moduleName]
          ) {
            overriddenModules.push(mod);
          } else {
            nextOverriddenModules.push(mod);
          }
        }
      });

    overriddenModules.sort(sorter);
    defaultModules.sort(sorter);
    nextOverriddenModules.sort(sorter);

    const filterAsApp = x => x.moduleName.indexOf('_fallback') === -1;
    const filterAsFallback = x => x.moduleName.indexOf('_fallback') !== -1;

    const apps = {
      nextOverriddenModules: nextOverriddenModules.filter(filterAsApp),
      pendingRefreshDefaultModules: pendingRefreshDefaultModules.filter(filterAsApp),
      disabledOverrides: disabledOverrides.filter(filterAsApp),
      overriddenModules: overriddenModules.filter(filterAsApp),
      externalOverrideModules: externalOverrideModules.filter(filterAsApp),
      devLibModules: devLibModules.filter(filterAsApp),
      defaultModules: defaultModules.filter(filterAsApp),
    }

    const fallbacks = {
      nextOverriddenModules: nextOverriddenModules.filter(filterAsFallback),
      pendingRefreshDefaultModules: pendingRefreshDefaultModules.filter(filterAsFallback),
      disabledOverrides: disabledOverrides.filter(filterAsFallback),
      overriddenModules: overriddenModules.filter(filterAsFallback),
      externalOverrideModules: externalOverrideModules.filter(filterAsFallback),
      devLibModules: devLibModules.filter(filterAsFallback),
      defaultModules: defaultModules.filter(filterAsFallback),
    }

    const { brokenMaps, workingCurrentPageMaps, workingNextPageMaps } =
      getExternalMaps();

    const allFallbacks = [
      ...fallbacks.nextOverriddenModules,
      ...fallbacks.pendingRefreshDefaultModules,
      ...fallbacks.disabledOverrides,
      ...fallbacks.overriddenModules,
      ...fallbacks.externalOverrideModules,
      ...fallbacks.devLibModules,
      ...fallbacks.defaultModules,
    ]

    const disableAllFallbacks = () => {
      allFallbacks.forEach(fallback => {
        window.importMapOverrides.addOverride(fallback.moduleName, 'fallback-disabled');
      })
    }
    
    const enableAllFallbacks = () => {
      allFallbacks.forEach(fallback => {
        window.importMapOverrides.removeOverride(fallback.moduleName);
      })
    }

    const onClickRow = (mod) => {
      this.setState({ dialogModule: mod })
    }

    const setToMap = (map) => {
      Object.keys(map.imports)
        .filter(x => x.indexOf('_fallback') === -1)
        .forEach(moduleName => {
          window.importMapOverrides.addOverride(moduleName, map.imports[moduleName]);
        });
    }

    const setToStaging = async () => {
      const stagingMap = await this.fetchMap('https://console.stg01.jumpcloud.com/importmap.json')
      setToMap(stagingMap);
    }

    const setToProd = async () => {
      const prodMap = await this.fetchMap('https://console.jumpcloud.com/importmap.json')
      setToMap(prodMap);
    }

    const setToPr = async () => {
    };    

    return (
      <div className="imo-list-container">
        <div className="imo-table-header-actions">
          <input
            className="imo-list-search"
            aria-label="Search modules"
            placeholder="Search modules"
            value={this.state.searchVal}
            onInput={(evt) => this.setState({ searchVal: evt.target.value })}
            ref={(ref) => (this.inputRef = ref)}
          />
          <div className="imo-add-new">
            <button
              onClick={() =>
                this.setState({
                  dialogModule: { moduleName: "New module", isNew: true },
                })
              }
            >
              Add new module
            </button>
          </div>
          <div className="imo-add-new">
            <button
              onClick={() => {
                this.setState({
                  dialogExternalMap: { url: "", isNew: true },
                });
              }}
            >
              Add import map
            </button>
          </div>
          <div className="imo-add-new">
            <button onClick={() => window.importMapOverrides.resetOverrides()}>
              Reset all overrides
            </button>
          </div>
        </div>
        <h3>Apps</h3>
        <div class="button-row">
          <p>Set to:</p>
          <button onClick={setToStaging}>Staging</button>
          <button onClick={setToProd}>Production</button>
          <button onClick={setToPr}>PR</button>
        </div>
        <ModuleTable
          nextOverriddenModules={apps.nextOverriddenModules}
          pendingRefreshDefaultModules={apps.pendingRefreshDefaultModules}
          disabledOverrides={apps.disabledOverrides}
          overriddenModules={apps.overriddenModules}
          externalOverrideModules={apps.externalOverrideModules}
          devLibModules={apps.devLibModules}
          defaultModules={apps.defaultModules}
          onClickRow={onClickRow}
          stagingMap={this.state.stagingMap}
          prodMap={this.state.prodMap}
        />
        <h3>Fallbacks</h3>
        <button
          className="imo-add-new"
          onClick={disableAllFallbacks}
        >Disable Fallbacks</button>
        <button
          className="imo-add-new"
          onClick={enableAllFallbacks}
        >Enable Fallbacks</button>
        <ModuleTable
          nextOverriddenModules={fallbacks.nextOverriddenModules}
          pendingRefreshDefaultModules={fallbacks.pendingRefreshDefaultModules}
          disabledOverrides={fallbacks.disabledOverrides}
          overriddenModules={fallbacks.overriddenModules}
          externalOverrideModules={fallbacks.externalOverrideModules}
          devLibModules={fallbacks.devLibModules}
          defaultModules={fallbacks.defaultModules}
          onClickRow={onClickRow}
        />
        {(brokenMaps.length > 0 ||
          workingCurrentPageMaps.length > 0 ||
          workingNextPageMaps.length > 0) && (
          <table className="imo-overrides-table">
            <thead>
              <th>Import Map Status</th>
              <th>URL</th>
            </thead>
            <tbody>
              {brokenMaps.map((url) => (
                <tr
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    this.setState({ dialogExternalMap: { isNew: false, url } })
                  }
                  key={url}
                >
                  <td>
                    <div className="imo-status imo-disabled-override" />
                    <div>Invalid</div>
                  </td>
                  <td>{url}</td>
                </tr>
              ))}
              {workingNextPageMaps.map((url) => (
                <tr
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    this.setState({ dialogExternalMap: { isNew: false, url } })
                  }
                  key={url}
                >
                  <td>
                    <div className="imo-status imo-next-override" />
                    <div>Pending refresh</div>
                  </td>
                  <td>{url}</td>
                </tr>
              ))}
              {workingCurrentPageMaps.map((url) => (
                <tr
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    this.setState({ dialogExternalMap: { isNew: false, url } })
                  }
                  key={url}
                >
                  <td>
                    <div className="imo-status imo-current-override" />
                    <div>Override</div>
                  </td>
                  <td>{url}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  reload = (evt) => {
    evt.stopPropagation();
    window.location.reload();
  };

  cancel = () => {
    this.setState({ dialogModule: null, dialogExternalMap: null });
  };

  updateModuleUrl = (newUrl) => {
    newUrl = newUrl || null;

    if (newUrl === null) {
      window.importMapOverrides.removeOverride(
        this.state.dialogModule.moduleName
      );
    } else {
      window.importMapOverrides.addOverride(
        this.state.dialogModule.moduleName,
        newUrl
      );
    }

    this.setState({ dialogModule: null });
  };

  doUpdate = () => {
    this.forceUpdate();
    window.importMapOverrides.getNextPageMap().then((nextPageMap) => {
      this.setState({ nextPageMap });
    });
  };

  addNewModule = (name, url) => {
    if (name && url) {
      window.importMapOverrides.addOverride(name, url);
    }
    this.setState({ dialogModule: null });
  };

  filterModuleNames = (moduleName) => {
    return this.state.searchVal.trim().length > 0
      ? includes(moduleName, this.state.searchVal)
      : true;
  };

  async fetchMap(url) {
    return new Promise((resolve, reject) => {
      if (url === "https://console.stg01.jumpcloud.com/importmap.json") {
        resolve(
          {"imports":{"@jumpcloud-ap/monolith_app":"https://cdn03.jumpcloud.com/admin/@jumpcloud-ap/monolith_app/20240719.19.2628-e48329/app.js","@jumpcloud-ap/monolith_app_fallback":"https://cdn03.jumpcloud.com/admin/@jumpcloud-ap/monolith_app/20240719.17.1515-bae444/app.js","@jumpcloud-ap/peripheralui_app":"https://cdn03.jumpcloud.com/admin/@jumpcloud-ap/peripheralui_app/20240719.17.1515-bae444/app.js","@jumpcloud-ap/peripheralui_app_fallback":"https://cdn03.jumpcloud.com/admin/@jumpcloud-ap/peripheralui_app/20240703.18.2354-4bb359/app.js","@jumpcloud-ap/sidenav_app":"https://cdn03.jumpcloud.com/admin/@jumpcloud-ap/sidenav_app/20240719.17.1515-bae444/app.js","@jumpcloud-ap/sidenav_app_fallback":"https://cdn03.jumpcloud.com/admin/@jumpcloud-ap/sidenav_app/20240717.17.639-07ad30/app.js","@jumpcloud-ap/topnav_app":"https://cdn03.jumpcloud.com/admin/@jumpcloud-ap/topnav_app/20240719.17.1515-bae444/app.js","@jumpcloud-ap/topnav_app_fallback":"https://cdn03.jumpcloud.com/admin/@jumpcloud-ap/topnav_app/20240719.14.5025-8af490/app.js"}}
        )
      } else if (url === "https://console.jumpcloud.com/importmap.json") {
        resolve(
          {"imports":{"@jumpcloud-ap/monolith_app":"https://cdn03.jumpcloud.com/admin/@jumpcloud-ap/monolith_app/20240719.19.2628-e48329/app.js","@jumpcloud-ap/monolith_app_fallback":"https://cdn03.jumpcloud.com/admin/@jumpcloud-ap/monolith_app/20240719.17.1515-bae444/app.js","@jumpcloud-ap/peripheralui_app":"https://cdn03.jumpcloud.com/admin/@jumpcloud-ap/peripheralui_app/20240719.17.1515-prodma/app.js","@jumpcloud-ap/peripheralui_app_fallback":"https://cdn03.jumpcloud.com/admin/@jumpcloud-ap/peripheralui_app/20240702.19.937-a66bf3/app.js","@jumpcloud-ap/sidenav_app":"https://cdn03.jumpcloud.com/admin/@jumpcloud-ap/sidenav_app/20240719.17.1515-bae444/app.js","@jumpcloud-ap/sidenav_app_fallback":"https://cdn03.jumpcloud.com/admin/@jumpcloud-ap/sidenav_app/20240717.17.637-2809d4/app.js","@jumpcloud-ap/topnav_app":"https://cdn03.jumpcloud.com/admin/@jumpcloud-ap/topnav_app/20240719.17.1515-bae444/app.js","@jumpcloud-ap/topnav_app_fallback":"https://cdn03.jumpcloud.com/admin/@jumpcloud-ap/topnav_app/20240719.14.5025-8af490/app.js"}}
        )
      } else {
        reject('invalid source');
      }
    })
      .then((importMap) => expandRelativeUrlsInImportMap(importMap, url));
  }
}

function sorter(first, second) {
  return first.moduleName > second.moduleName;
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

function getExternalMaps() {
  const allExternalMaps = window.importMapOverrides.getExternalOverrides();
  const allCurrentPageMaps =
    window.importMapOverrides.getCurrentPageExternalOverrides();
  const brokenMaps = [],
    workingCurrentPageMaps = [],
    workingNextPageMaps = [];

  for (let externalMap of allExternalMaps) {
    if (includes(window.importMapOverrides.invalidExternalMaps, externalMap)) {
      brokenMaps.push(externalMap);
    } else {
      if (includes(allCurrentPageMaps, externalMap)) {
        workingCurrentPageMaps.push(externalMap);
      } else {
        workingNextPageMaps.push(externalMap);
      }
    }
  }

  return {
    brokenMaps,
    workingCurrentPageMaps,
    workingNextPageMaps,
  };
}
