import React from 'react'
class DropdownList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }
    onChange = (e) => {
        this.props.onSelected(e.target.value);
    }
    render() {
        //Removed by RG 04/08/2021 tabIndex="-1"
        return (
            <select
                onChange={this.onChange.bind(this)}
                id={this.props.Id}
                className={this.props.ClassName}
                disabled={!!this.props.Disabled}
                style={{ width: '100%' }} data-select2-id="1" aria-hidden="true">
                <option value={0} >Select {this.props.Name}</option>
                {this.props.Options.map((item, idx) => (
                    <option id={idx} value={item.Value} key={idx} >{item.Name}</option>
                ))}
            </select>
        );
    }
}
DropdownList.defaultProps = {
    ClassName: "form-control select2 select2-hidden-accessible",
    Id: "",
    Name: "",
    Options: [{}],
    ValuColumn: '',
    Disabled: false
}

export default DropdownList;
