import React, { Component } from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { setHours, setMinutes } from "date-fns";
import Modal from "react-awesome-modal";
import moment from "moment";
import { th } from "date-fns/locale";
import ApiProvider from "../DataProvider.js";
import Button from "../../../ReactComponents/Button/Button.jsx";
import * as appCommon from "../../../Common/AppCommon.js";
import { CreateValidator, ValidateControls } from "../Validation.js";
import { ToastContainer, toast } from "react-toastify";
import swal from "sweetalert";
import { DELETE_CONFIRMATION_MSG } from "../../../Contants/Common.js";
import { getTaskQuestionImage } from "../../../Services/notificationService";

export default class ViewQuestionImg extends Component {
  constructor(props) {
    super(props);
    this.state = {
      taskId: "",
      QuestionName: "",
      QuesId: "",
      QuesData: [],
      beforeImage: null,
      afterImage: null,
      loadingImage: true,
    };
    this.ApiProvider = new ApiProvider();
  }

  manageQuestionImg = (model, type) => {
    this.ApiProvider.manageQuesImage(model, type)
      .then(async (resp) => {
        const text = await resp.text();

        if (!text) {
          swal({
            icon: "error",
            title: "Error",
            text: "No image exists for the specified TaskQuestionImageId",
          });
          return;
        }

        const rData = JSON.parse(text);

        if (!rData?.Image) {
          swal({
            icon: "error",
            title: "Error",
            text: "No image exists for the specified TaskQuestionImageId",
          });
          return;
        }

        this.setState({ QuestImageData: rData.Image });
      })
      .catch(() => {
        swal({
          icon: "error",
          title: "Error",
          text: "Unable to load image",
        });
      });
  };

  getQuesModel = (type, Id) => {
    var model = [];
    switch (type) {
      case "R":
        model.push({
          CmdType: type,
          Id: Id,
        });
        break;
      case "D":
        model.push({
          CmdType: type,
          Id: Id,
        });
        console.log(model);
        break;
      default:
    }
    return model;
  };

  manageQues = (model, type) => {
    this.ApiProvider.manageQues(model, type).then((resp) => {
      if (resp.ok && resp.status == 200) {
        return resp.json().then((rData) => {
          switch (type) {
            case "C":
              if (rData === "Created !") {
                appCommon.showtextalert(
                  "Question Saved Successfully!",
                  "",
                  "success",
                );
                console.log("Question Saved Successfully!");
                this.handleCancel();
              }
            case "R":
              let quesData = rData.map((element) => ({
                QuesId: element.QuestID,
                QuesName: element.QuestionName,
                Action: element.Action,
                Remark: element.Remarks,
              }));
              this.setState({ QuesData: quesData });
              break;
            case "D":
              if (rData === "Deleted !") {
                appCommon.showtextalert(
                  "Question Deleted Successfully!",
                  "",
                  "success",
                );
              } else {
                appCommon.showtextalert("Someting went wrong !", "", "error");
              }
              this.getQuestion();
              break;
            default:
          }
        });
      }
    });
  };

  getQuestion() {
    var type = "R";
    const taskId = this.props.rowData.TaskId;
    var model = this.getQuesModel(type, taskId);
    this.manageQues(model, type);
  }

  componentDidMount = async () => {
    const { TaskId, QuesId, CreatedOn } = this.props.rowData || {};

    if (!TaskId || !QuesId || !CreatedOn) {
      this.setState({ loadingImage: false });
      return;
    }

    this.setState({ loadingImage: true }); // 👈 START LOADING

    try {
      const res = await getTaskQuestionImage({
        taskId: TaskId,
        questId: QuesId,
        createdOn: moment(
          CreatedOn,
          ["YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ss.SSS", "DD-MM-YYYY"],
          true,
        ).format("YYYY-MM-DD"),
      });

      this.setState({
        beforeImage: res.beforeImage,
        afterImage: res.afterImage,
        loadingImage: false, // 👈 DONE
      });
    } catch (err) {
      this.setState({ 
        beforeImage: null,
        afterImage: null,
        loadingImage: false 
      });
    }
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevState.selectedCategory !== this.state.selectedCategory) {
      this.getSubCategory();
    }
  }

  handleCancel = () => {
    this.props.closeModal();
  };

  removeQuesFields = (QuesId) => {
    console.log(QuesId);
    //debugger
    let myhtml = document.createElement("div");
    myhtml.innerHTML = DELETE_CONFIRMATION_MSG + "</hr>";
    alert: swal({
      buttons: {
        ok: "Yes",
        cancel: "No",
      },
      content: myhtml,
      icon: "warning",
      closeOnClickOutside: false,
      dangerMode: true,
    }).then((value) => {
      switch (value) {
        case "ok":
          this.setState({ QuesId: QuesId }, () => {
            var type = "D";
            var model = this.getQuesModel(type, QuesId);
            this.manageQues(model, type);
          });
          break;
        case "cancel":
          break;
        default:
          break;
      }
    });
  };

  render() {
    console.log(this.props);
    return (
      <div>
        <Modal
          visible={this.props.showEditQuestionModel}
          effect="fadeInUp"
          onClickAway={this.props.closeModal}
          width="900"
        >
          <div className="view-image-modern-modal" style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            {/* Modern Header */}
            <div className="modal-header-custom" style={{ 
              padding: '20px 24px', 
              background: '#f8fafc', 
              borderBottom: '1px solid #e2e8f0', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                  <i className="far fa-images mr-2 text-primary"></i> Question Evidence
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  {this.props.rowData?.TaskName} — {this.props.rowData?.QuestionName} ({this.props.rowData?.CreatedOn})
                </p>
              </div>
              <button
                className="btn-close-custom"
                onClick={this.props.closeModal}
                style={{ 
                  background: '#f1f5f9', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#64748b', 
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div
              className="modal-body-custom"
              style={{ padding: '32px', maxHeight: '70vh', overflowY: 'auto', background: '#fff' }}
            >
              {!this.state.loadingImage && !this.state.beforeImage && !this.state.afterImage && (
                <div className="no-images-placeholder text-center py-5" style={{ background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
                   <div style={{ marginBottom: '16px' }}>
                     <i className="far fa-image fa-4x text-muted opacity-30"></i>
                   </div>
                   <h5 style={{ color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>No evidence images found</h5>
                   <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>There are no before or after images available for this checklist item.</p>
                </div>
              )}

              <div className="row" style={{ gap: '0', display: 'flex' }}>
                {(this.state.beforeImage || this.state.loadingImage) && (
                  <div className="col-md-6" style={{ padding: '0 12px' }}>
                    <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '12px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <h6 style={{ marginBottom: '12px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#64748b', marginRight: '8px' }}></span>
                        BEFORE
                      </h6>
                      <div style={{ 
                        flex: 1, 
                        background: '#fff', 
                        borderRadius: '8px', 
                        overflow: 'hidden', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        minHeight: '300px',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                      }}>
                        {this.state.loadingImage ? (
                          <div className="text-center">
                            <div className="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Loading image...</p>
                          </div>
                        ) : this.state.beforeImage ? (
                          <img
                            src={this.state.beforeImage}
                            alt="Before"
                            style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', transition: 'transform 0.3s' }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}

                {(this.state.afterImage || this.state.loadingImage) && (
                  <div className="col-md-6" style={{ padding: '0 12px' }}>
                    <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '12px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <h6 style={{ marginBottom: '12px', fontWeight: '700', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', marginRight: '8px' }}></span>
                        AFTER
                      </h6>
                      <div style={{ 
                        flex: 1, 
                        background: '#fff', 
                        borderRadius: '8px', 
                        overflow: 'hidden', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        minHeight: '300px',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                      }}>
                        {this.state.loadingImage ? (
                          <div className="text-center">
                            <div className="spinner-border spinner-border-sm text-success mb-2" role="status"></div>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Loading image...</p>
                          </div>
                        ) : this.state.afterImage ? (
                          <img
                            src={this.state.afterImage}
                            alt="After"
                            style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', transition: 'transform 0.3s' }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '20px 32px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={this.handleCancel}
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0', 
                  background: '#fff', 
                  color: '#475569', 
                  fontWeight: '600', 
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <ToastContainer />
      </div>
    );
  }
}
