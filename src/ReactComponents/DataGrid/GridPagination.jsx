import React from 'react';
import DataGridBL from './DataGridBL.js';
import '../../Scripts/pagination/jquery.simplePagination.js';
import '../../Scripts/pagination/simplePagination.css';
// import '../../App.css';
const $ = window.$;
let objpagination = new DataGridBL();
export default class GridPagination extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentpage: 1,
            datadata: []
        };
    }

    OnPageChange(pageinfo) {
        let currentpageelement = $(pageinfo.currentTarget).parent();
        // let liindex = 0;
        let cpage = 0;
        if (pageinfo.currentTarget.innerText === '»') // Next
        {
            if (this.props.totalpages > this.state.currentpage) {
                cpage = this.state.currentpage + 1;
                currentpageelement = $('.pagination li.active').next();
            }
        }
        else if (pageinfo.currentTarget.innerText === '«') // Previouse
        {
            if (this.state.currentpage > 0) {
                cpage = this.state.currentpage - 1;
                currentpageelement = $('.pagination li.active').prev();
            }
        }
        else {
            cpage = parseInt(pageinfo.currentTarget.innerText);
        }
        if (cpage > 0) {
            $('.pagination li.active').removeClass('active');
            $(currentpageelement).addClass('active');
            this.setState({ currentpage: cpage });
            $('.tbl-loading').removeClass('hide');
            this.props.Onpagechanged(cpage);
        }
    }

    componentDidMount() {
        // alert('did mount');
        // $('#singlePagination').pagination({
        //     items: 200,
        //     itemsOnPage: 10,
        //     cssStyle: 'light-theme',
        //     currentPage: 1,
        //     pages:20,
        //     useAnchors:false,
        //     onPageClick: function(pageNumber) {
        //        alert("Page click :"+pageNumber);
        //     }
        // });
    }
    onpagechangeevent(pagenumber) {
        //alert(pagenumber);
        $('.tbl-loading').removeClass('hide');
        this.setState({ currentpage: pagenumber }, () => {
            this.props.Onpagechanged(pagenumber);
        });
    }
    

    // onpagechangeevent(pagenumber) {
    //     //alert(pagenumber);
    //     $('.tbl-loading').removeClass('hide');
    //     this.state.currentpage = pagenumber;
    //     this.props.Onpagechanged(pagenumber);
    // }

    componentWillReceiveProps(props) {
        $('.tbl-loading').removeClass('hide');
        objpagination.initpagination(props.totalRows, props.pageSize, props.totalPages, this.state.currentpage, this.onpagechangeevent.bind(this));
        // //alert('props changed');
        // // $(".pagination ul").addClass('disabled');
        // //$('.tbl-loading').removeClass('hide');
        // $('.ui-paggination').removeClass('hide');
        // if (props.totalpages > 0) {
        //     $('.pagination a').unbind("click");
        //     $('.pagination a').on('click', this.OnPageChange.bind(this));
        //     $('.pagination a').css("cursor", "pointer");
        // }
        // else {
        //     $('.ui-paggination').addClass('hide');
        // }
    }


    // ManagePaging(currentpage, totalpages, totalRecords) {
    //     $(objIdentity.NodeDetailsDivPaging).remove();
    //     var pageHtml = objGeneric.GetPaging(currentpage, totalpages, totalRecords)
    //     $(pageHtml).attr("id", "divPaging").appendTo($(objIdentity.NodeDetailsCardHeader));
    //     $('.pagination a').registerfunctions('click', onPaginClick);
    //     $('.pagination a').css("cursor", "pointer");
    // }
    render() {
        // let rows = [];
        // rows.push(<li key="ps" className="PagedList-skipToPrevious"><a rel="prev" >«</a></li>);
        // for (let i = 0; i < this.props.totalpages; i++) {
        //     if (i == 0)
        //         rows.push(<li className="active" key={i} ><a  >{i + 1}</a></li>);
        //     else
        //         rows.push(<li key={i}><a>{i + 1}</a></li>);
        // }
        // rows.push(<li key="pe" className="PagedList-skipToNext"><a rel="next">»</a></li>);

        // for (let i = 0; i < this.props.totalpages; i++) {
        //     rows.push(i);
        // }
        //alert(rows);
        return (
            <div className="pagination-container">
                <div id="singlePagination">
                </div>
            </div>
        );
    }
}
GridPagination.defaultProps = {
    totalPages: 0,
    totalRows: 0,
    pageSize: 10

}


// class PageSerial extends React.Component {
//     constructor(props) {
//         super(props);
//         this.state = {}
//     }
//     componentDidMount() {

//     }
//     render() {
//         //alert(this.props.pagenumber);
//         // if (this.props.pagenumber = 0) {
//         //     return (
//         //         <li class="PagedList-skipToPrevious">
//         //             <a rel="prev" >«</a></li>
//         //     )
//         // }
//         // else if (this.props.pagenumber > this.props.totalpages) {
//         //     <li class="PagedList-skipToNext"><a rel="next" >»</a></li>
//         // }
//         // else {
//         return (


//             <div id="singlePagination">
//                 <li><a >{this.props.pnumber}</a></li>
//             </div>
//         );
//         //}
//     }
// }



