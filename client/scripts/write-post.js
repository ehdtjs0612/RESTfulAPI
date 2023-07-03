const submitBtn = document.getElementById("submit-button");
const cancelBtn = document.getElementById("cancel-button");


submitBtn.addEventListener("click", () => {
  if (validateInput()) {
    createPostFetch();
  }
});

cancelBtn.addEventListener("click", () => {
  location.href = "/community";
});

const validateInput = () => {
  const titleValue = document.getElementById("input-title").value;
  const contentValue = document.getElementById("input-content").value;

  if (titleValue.length === 0) {
    alert("제목이 입력되지 않았습니다")
    return false;
  }

  if (titleValue.length > 30) {
    alert("제목이 너무 깁니다 30자 내로 입력해주세요");
    return false;
  }

  if (contentValue.length === 0) {
    alert("내용이 입력되지 않았습니다");
    return false;
  }

  if (contentValue.length > 1000) {
    alert("본문의 내용이 너무 깁니다");
    return false;
  }

  return true;
}

const createPostFetch = async () => {
  const titleValue = document.getElementById("input-title").value;
  const contentValue = document.getElementById("input-content").value;

  try {
    const userId = sessionStorage.getItem("loginUserSession")
    const result = await fetch("/api/post", {
      "method": "POST",
      "headers": {
        "Content-Type": "application/json"
      },
      "body": JSON.stringify({
        "userId": userId,
        "title": titleValue,
        "content": contentValue
      })
    });

    const json = await result.json();
    if (json.success) {
      location.href = "/community";
    }

  } catch (error) {
    console.error(error);
  }
}