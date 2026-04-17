import React, { Component } from 'react';
import AssetsMaster from '../MainComponents/AssetsMaster/AssetsMaster'
class AssetsMasterPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            PageMode: 'Home',
            PageTitle: 'Asstes Master'
        };
    }
    render() {
        return (
            <div className="content-wrapper">
                <section className="content mt-3">
                    <div className="container-fluid">
                        <AssetsMaster />
                    </div>
                </section>
            </div>
        );
    }
}

export default AssetsMasterPage;
