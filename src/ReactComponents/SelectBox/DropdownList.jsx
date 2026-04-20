import React from 'react'
class DropdownList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedValue:
                props.Value !== undefined && props.Value !== null
                    ? props.Value
                    : (props.DefaultValue !== undefined && props.DefaultValue !== null ? props.DefaultValue : 0)
        };
    }
    onChange = (e) => {
        const nextValue = e.target.value;
        if (this.props.Value === undefined || this.props.Value === null) {
            this.setState({ selectedValue: nextValue });
        }
        this.props.onSelected(e.target.value);
    }

    componentDidUpdate(prevProps) {
        const hadControlledValue =
            prevProps.Value !== undefined && prevProps.Value !== null;
        const hasControlledValue =
            this.props.Value !== undefined && this.props.Value !== null;

        if (hasControlledValue) {
            if (prevProps.Value !== this.props.Value) {
                this.setState({ selectedValue: this.props.Value });
            }
            return;
        }

        if (!hadControlledValue) {
            const prevDefault = prevProps.DefaultValue;
            const nextDefault = this.props.DefaultValue;
            if (
                prevDefault !== nextDefault &&
                nextDefault !== undefined &&
                nextDefault !== null
            ) {
                this.setState({ selectedValue: nextDefault });
            }
        }
    }
    render() {
        //Removed by RG 04/08/2021 tabIndex="-1"
        const value =
            this.props.Value !== undefined && this.props.Value !== null
                ? this.props.Value
                : this.state.selectedValue;
        return (
            <select
                onChange={this.onChange.bind(this)}
                id={this.props.Id}
                className={this.props.ClassName}
                disabled={!!this.props.Disabled}
                value={value ?? 0}
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
    Disabled: false,
    Value: null,
    DefaultValue: 0
}

export default DropdownList;
