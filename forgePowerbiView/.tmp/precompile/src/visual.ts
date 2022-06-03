
module powerbi.extensibility.visual.forgePowerbiView4F623CD7FE44432EB2E71CF579A63B03  {
    "use strict";
    export class PowerBI_ForgeViewer_Visual implements IVisual {

        //private readonly DOCUMENT_URN: string = 'urn:dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLlBPYXV4REk0VFRPbXdicnpLVjRRc0E_dmVyc2lvbj0x';

        // if get token from your server
        private ACCESS_TOKEN: string = null;
        private MY_SERVER_ENDPOINT = 'https://mamserver.herokuapp.com/api/forge/oauth/token'

        // if hard coded the token
        //private ACCESS_TOKEN: string = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IlU3c0dGRldUTzlBekNhSzBqZURRM2dQZXBURVdWN2VhIn0.eyJzY29wZSI6WyJkYXRhOnJlYWQiLCJkYXRhOndyaXRlIiwiZGF0YTpjcmVhdGUiLCJidWNrZXQ6cmVhZCIsImJ1Y2tldDpjcmVhdGUiLCJidWNrZXQ6ZGVsZXRlIl0sImNsaWVudF9pZCI6IkN1d3VLVEFRUGcwVmR5OE1INlZqb1NHMklNUUM5MXFXIiwiYXVkIjoiaHR0cHM6Ly9hdXRvZGVzay5jb20vYXVkL2Fqd3RleHA2MCIsImp0aSI6InN6czZGQ0xXQkVPdHE4UHMyZ0VXM3BCOWlodTV0NzlXbGtVOE56eFFkTnU0cHowWmNpR3ZTQmFZa1M2dXdjRGEiLCJleHAiOjE2NDU0NjMyMDh9.HRVQ_NzgSLHQVfaG4RToaf1GeX5LRtmQ3uS-KWBDBFSeTXIug_z4ESNz33XJCYOMN2mQ7tS1zoGZOYEP5D5UhCNlIgSX9Zh_M_9BJ9RIbqe4vrQFEMpdXTzpReAoki2zXC1CKcNPAih2nE5bweslteeMQe24E0hT-VAwpqjF-Hy0_J3xWd-oFqaMn_HWTvw7nOpLEZKCDDXvqwiGvOdo8EndqSKSDUTWlXGy20taW6nr534jLWwrKnR0FQsLBo1W3k5X8kwUi2Vwh3GjBfgkZ2Bo2szKhP0rDWtf1_75Y9w8RXgpe4D_I3JqE7qLlos9Daq6MPPzW9A4GSJ8MOkbnA';

        private target: HTMLElement;
        private pbioptions: VisualConstructorOptions;
        private updateCount: number;
        private settings: VisualSettings;
        private textNode: Text;
        private forge_viewer: Autodesk.Viewing.GuiViewer3D = null;
        private selectionMgr: ISelectionManager = null;
        private selectionIdBuilder: ISelectionIdBuilder = null;


        constructor(options: VisualConstructorOptions) {

            this.pbioptions = options;
            this.target = options.element;
            this.target.innerHTML = '<div id="forge-viewer" ></div>';

            if (typeof document !== "undefined") {

                if (this.ACCESS_TOKEN != null) {
                    //hard-coded token, load the model directly
                    this.initializeViewer("forge-viewer");

                } else {
                    this.getToken(this.MY_SERVER_ENDPOINT);
                    //inside getToken callback, will load the model

                }
            }
        }


        private async getToken(endpoint): Promise<void> {

            return new Promise<void>(res => {
                $.ajax({
                    url: endpoint,

                }).done(res => {
                    console.log('get token done!')
                    //console.log(res.access_token);

                    //when token is ready, start to initialize viewer
                    this.ACCESS_TOKEN = res.access_token;
                    this.initializeViewer("forge-viewer");
                })
            })
        }
        //Funcion para crear una instancia de visor vacía. Se necesita actualizar los valores de project y model para ver algo.

        private async initializeViewer(placeHolderDOMid: string): Promise<void> {
            const viewerContainer = document.getElementById(placeHolderDOMid)
            //load Forge Viewer scripts js and style css
            await this.loadForgeViewerScriptAndStyle();
            const options = {
                env: 'AutodeskProduction',
                accessToken: this.ACCESS_TOKEN
            }

            Autodesk.Viewing.Initializer(options, () => {
                var config3D = { extensions: ['Autodesk.DocumentBrowser', 'LogoExtension-MAM'] }
                var documentId = null
                this.forge_viewer = new Autodesk.Viewing.GuiViewer3D(viewerContainer, config3D)
                this.forge_viewer.start();
                Autodesk.Viewing.Document.load(documentId, (doc) => {

                    //if specific viewerable, provide its guid
                    //otherwise, load the default view
                    var viewableId = undefined
                    var viewables: Autodesk.Viewing.BubbleNode = (viewableId ? doc.getRoot().findByGuid(viewableId) : doc.getRoot().getDefaultGeometry());
                    this.forge_viewer.loadDocumentNode(doc, viewables, {}).then(i => {
                        console.log('document has been loaded')

                        this.forge_viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, res => {
                            //GEOMETRY_LOADED_EVENT
                            console.log('GEOMETRY_LOADED_EVENT triggered!');

                            console.log('dumpping dbIds...');

                            this.forge_viewer.getObjectTree(tree => {
                                var leaves = [];
                                tree.enumNodeChildren(tree.getRootId(), dbId => {
                                    if (tree.getChildCount(dbId) === 0) {
                                        leaves.push(dbId);
                                    }
                                }, true);
                                //console.log('DbId Array: ' + leaves)
                                //possible to update PowerBI data source ??
                                //SQL database / Push Data ...
                                //see PowerBI community post:
                                //

                            });
                        })

                        this.forge_viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, res => {

                            //Investigation on how to update PowerBI Visual when objects are selected in Forge Viewer
                            if (res.dbIdArray.length === 1) {
                                const dbId = res.dbIdArray[0];
                                console.log('Autodesk.Viewing.SELECTION_CHANGED_EVENT:' + dbId)
                                //this.selectionMgr.select()
                            }
                        })
                    });

                }, (err) => {
                    console.error('onDocumentLoadFailure() - errorCode:' + err);
                });
            });

        }

        /*private async loadForgeViewerScripts1(): Promise<void> {
            //this will cause cross-regions error
            return new Promise<void>(res => {
                $.ajax({
                    url: 'https://developer.api.autodesk.com/modelderivative/v2/viewers/viewer3D.min.js',
                    dataType: "script"
                  }).done( () => {
                    console.log('ok')
                    res();
                  })
            
            })
        } */




        private async loadForgeViewerScriptAndStyle(): Promise<void> {

            return new Promise<void>((reslove, reject) => {

                let forgeviewerjs = document.createElement('script');
                forgeviewerjs.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/viewer3D.js';
                forgeviewerjs.id = 'forgeviewerjs';
                document.body.appendChild(forgeviewerjs);
                //onload functions
                forgeviewerjs.onload = () => {
                    console.info("Viewer scripts loaded");
                    let link = document.createElement("link");
                    link.rel = 'stylesheet';
                    link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/style.min.css';
                    link.type = 'text/css';
                    link.id = "forgeviewercss";
                    document.body.appendChild(link);
                    reslove();
                    console.log('Visor creado')
                    // //CSS 
                    // let css = document.createElement("link");
                    // css.rel = 'stylesheet';
                    // css.href = 'https://github.com/mamdlc/powerbistyles/blob/f188af1e757182f7d7cd1b67cfe2970a3d6d80dd/styles.css';
                    // css.type = 'text/css';
                    // css.id = "stylescss";
                    // document.body.appendChild(css);
                    // // Extensiones
                    // let logoExt = document.createElement('script');
                    // logoExt.src = 'https://github.com/mamdlc/powerbistyles/blob/f188af1e757182f7d7cd1b67cfe2970a3d6d80dd/logo.js';
                    // logoExt.id = 'logojs';
                    // document.body.appendChild(logoExt);
                    // //logo-overlay
                    // let logoOverlaydiv = document.createElement('div');
                    // logoOverlaydiv.id = 'logo-overlay';
                    // forgeviewerjs.appendChild(logoOverlaydiv);
                    // //logo
                    // let logodiv = document.createElement('div');
                    // logodiv.id = 'logo';
                    // logoOverlaydiv.appendChild(logodiv);
                };

                forgeviewerjs.onerror = (err) => {
                    console.info("Viewer scripts error:" + err);
                    reject(err);
                };

            })

        };
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            const settings: VisualSettings = this.settings || <VisualSettings>VisualSettings.getDefault();
            return VisualSettings.enumerateObjectInstances(settings, options);
        }

        public update(options: VisualUpdateOptions) {
            let dataView: DataView = options.dataViews[0]
            this.settings = VisualSettings.parse<VisualSettings>(dataView);
            var project = this.settings.credentials.project;
            var model = this.settings.credentials.model;
            var update = this.settings.credentials.update
            if (update == true) {
                //   this.settings.credentials.update = false
                // this.forge_viewer.finish()
                var c_project = utf8_to_b64(project);
                var c_model = utf8_to_b64(model);
                var url = 'https://mamserver.herokuapp.com/api/models/get?project=' + c_project + '&model=' + c_model
                fetch(url, {
                })
                    .then(res => {
                        res.json().then(data => {
                            var documentId = 'urn:' + data.urn
                            console.log('urn obtained!')
                            //------------------------------------------------------//
                            Autodesk.Viewing.Document.load(documentId, (doc) => {
                                var viewableId = undefined
                                var viewables: Autodesk.Viewing.BubbleNode = (viewableId ? doc.getRoot().findByGuid(viewableId) : doc.getRoot().getDefaultGeometry());
                                this.forge_viewer.loadDocumentNode(doc, viewables, {}).then(i => {
                                    console.log('document has been loaded')
                                    this.forge_viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, res => {
                                        //GEOMETRY_LOADED_EVENT
                                        console.log('GEOMETRY_LOADED_EVENT triggered!');
                                        console.log('dumpping dbIds...');
                                        this.forge_viewer.getObjectTree(tree => {
                                            var leaves = [];
                                            tree.enumNodeChildren(tree.getRootId(), dbId => {
                                                if (tree.getChildCount(dbId) === 0) {
                                                    leaves.push(dbId);
                                                }
                                            }, true);
                                        });
                                    })

                                    this.forge_viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, res => {
                                        //Investigation on how to update PowerBI Visual when objects are selected in Forge Viewer
                                        if (res.dbIdArray.length === 1) {
                                            const dbId = res.dbIdArray[0];
                                            console.log('Autodesk.Viewing.SELECTION_CHANGED_EVENT:' + dbId)
                                            //this.selectionMgr.select()
                                        }
                                    })
                                });

                            }, (err) => {
                                console.error('onDocumentLoadFailure() - errorCode:' + err);
                            });

                        });
                    });



            }
            if (options.type == 4) //|| options.type == 32//resizing or moving
                return;
            if (!this.forge_viewer) {
                return;
            }
            console.log('update with VisualUpdateOptions')

            const dbIds = options.dataViews[0].table.rows.map(r =>
                <number>r[0].valueOf());
            console.log('dbIds: ' + dbIds)
            this.forge_viewer.showAll();

            //  this.forge_viewer.impl.setGhostingBrightness(true); //for isolate effect 
            this.forge_viewer.isolate(dbIds);

            this.forge_viewer.fitToView(dbIds);

            this.settings = VisualSettings.parse<VisualSettings>(dataView);

            //Decode functions:
            function utf8_to_b64(str) {
                return window.btoa((encodeURIComponent(str)));
            }

            function b64_to_utf8(str) {
                return decodeURIComponent((window.atob(str)));
            }

        }

        private static parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

        /** 
         * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the 
         * objects and properties you want to expose to the users in the property pane.
         * 
         */

    }
    

}
