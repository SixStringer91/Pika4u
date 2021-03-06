'use strict'
const firebaseConfig = {
	apiKey: "AIzaSyDOTTlPMSSWRt28FlIKZVrUdMhxYzFa-l0",
	authDomain: "picachu-44ee1.firebaseapp.com",
	databaseURL: "https://picachu-44ee1.firebaseio.com",
	projectId: "picachu-44ee1",
	storageBucket: "picachu-44ee1.appspot.com",
	messagingSenderId: "961824820476",
	appId: "1:961824820476:web:0e645e70587ab96fcb1b79",
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
// console.log(firebase);

const modal = document.querySelector(".modal-wrapper");
const slider = document.querySelector('.slider-wrapper');
const modalInner = document.querySelector(".modal-text");
const modalConfirm = document.querySelector(".modal-confirm");
const toggle = document.getElementById("menu-toogle");
const sideBar = document.querySelector(".sidebar");
const header = document.querySelector(".header-wrapper-logo");
const form = document.querySelector(".auth");
const signUp = document.querySelector(".sign-up");
const auth = document.querySelector(".auth");
const userLog = document.querySelector(".user");
const userLogout = document.querySelector(".exit");
const userName = document.querySelector(".user-name");
const editButton = document.querySelector(".user-edit");
const editForm = document.querySelector(".sidebar-edit");
const userAvatar = document.querySelector(".user-avatar");
const postWrapper = document.querySelector(".posts");
const commentsWrapper = document.querySelector(".comment-block_content");
const buttNewPost = document.querySelector(".button-new-post");
const addPost = document.querySelector(".add-post");
const addPhotoToPost = document.querySelector('.add-photo')
const commentBlock = document.querySelector(".comment-block");
const addComment = document.querySelector(".add-comment");
const inputGroup = document.querySelector(".input-group");
const commentHeader = document.querySelector(".comment-header");
const searchInput = document.querySelector('.search-input');
const headerMenu = document.querySelector('.header-menu');
const postOfTheWeek = document.querySelector('.card');
let postViewer;
let sliderViewer;


const registration = {
	
	user: null,
	initUser(handler, showPosts) {
		
		firebase.auth().onAuthStateChanged((user) => {
			  console.log(user);
			if (user) {
				this.user = user;
				if (!user.displayName) {
					const shortName = user.email.slice(0, user.email.indexOf("@"));
					user.updateProfile({
							displayName: shortName,
							photoURL: "img/somecat.png",
						})
						.then(() => {
							if (handler) handler();
						});
					return;
				}
			} else {
				this.user = null;
			}
			if (handler) handler();
			showPosts();
		});
	},

	logIn({email, password, callback}) {
		firebase
			.auth()
			.signInWithEmailAndPassword(email, password)
			.catch((error) => {
				let modalText;
				const errorCode = error.code;
				const errorMessage = error.message;
				if (errorCode === "auth/wrong-password") {
					console.log(errorMessage);
					modalText = "неверный пароль";
				} else if (errorCode === "auth/email-not-found") {
					console.log(errorMessage);
					modalText = "этот Email уже используется";
				} else {
					console.log(errorMessage);
					modalText = errorMessage;
				}
				callback(modalText);
			});
	},

	logOut(callback) {
		firebase.auth().signOut();
		callback();
	},

	signIn({email, password, callback}) {
		firebase
			.auth()
			.createUserWithEmailAndPassword(email, password)
			.then((data) => {
				console.log(data);
				//TODO
				firebase.database().ref("users/").push ({
						  email: data.user.email,
						  subs: '',
						  savedPosts:''
				});//TODO
			})
			.catch((error) => {
				let modalMessage;
				const errorCode = error.code;
				const errorMessage = error.message;
				if (errorCode === "auth/weak-password") {
					console.log(errorMessage);
					modalMessage = "слабый пароль";
				} else if (errorCode === "auth/email-already-in-use") {
					console.log(errorMessage);
					modalMessage = "этот Email уже используется";
				} else {
					console.log(errorMessage);
					modalMessage = errorMessage;
				}
				callback(modalMessage);
			})

	},

	userCheck(mail) {
		return users.find((obj) => obj.mail === mail);
	},
	validName(str) {
		const regName = /^[-\w.]+@([A-z0-9][-A-z0-9]+\.)+[A-z]{2,4}$/;
		return regName.test(str);
	},
	editUser({userName, userPhoto, callback, sendPosts}) {
		const user = firebase.auth().currentUser;
		const name = userName || user.displayName;
		const photo = userPhoto || user.photoURL;
		user.updateProfile({ displayName: name, photoURL: photo }).then(() => {
			this.user = user;
			if (callback) callback();
		});
		setPosts.allPosts.forEach((post) => {
			if (user.email === post.mail) {
				post.author = name;
				post.avatar = photo;
			}
			if (post.comments) {
				post.comments.forEach((comments) => {
					if (user.email === comments.email) {
						comments.author = name;
						comments.avatar = photo;
					}
				});
			}
		});
		sendPosts();
		editForm.classList.add("visible");
		editForm.reset();
	},
};

const setPosts = {
	commentsMode: 0,
	likedPost: 0,
	userSubs: null,
	allPosts: [],
	savedPosts : '',

	//TODO
	getUserSavedPosts(){
		return new Promise((resolve)=>{
			firebase.database().ref("users/")
				.orderByChild("name")
				.on("child_added", (data) => {
					if(registration.user.email===data.val().email){
						const subsData =	data.val().savedPosts
			 			resolve({name: data.ref.path.pieces_[1],savedPosts: subsData ? subsData : []});
						}
						})
		
		})
	},
//TODO
	postSaver (postId){
		this.getUserSavedPosts()
			.then((data)=> {
				const findPost = data.savedPosts.findIndex((post)=>post===postId)
				console.log(findPost);
				if(findPost>=0){
					data.savedPosts.splice(findPost,1)
				}
				else data.savedPosts.push(postId)
				firebase.database().ref(`users/${data.name}`).update({
				'savedPosts' : data.savedPosts
				})
				this.savedPosts = data;
		});

	},
	makePost(form, modalHandler) {
		const user = firebase.auth().currentUser;
		const { title, text, tags, pic } = form.elements;
		let message;
		const replacer = arg => arg.replace(/<\/?[^>]+(>|$)/g, "");
		const editFunc = (arg,handler)=>{
			if(arg){
			return handler(arg).split(" ").join("").split(",")
			}
			else return null
		}
		if (title.value.length < 3) {
			message = "Название поста слишком короткое!";
		} else if (text.value.length < 20) {
			message = "Длина поста слишком короткая";
		} else {
			this.allPosts.unshift({
				id: 		`postID${(+new Date())
				.toString(16)}-${user.uid}`,
				title: 	replacer(title.value),
				text:		replacer(text.value),
				pics: editFunc(pic.value,replacer),
				tags: editFunc(tags.value,replacer),
				mail: 	user.email,
				author: user.displayName,
				avatar: user.photoURL,
				date: new Date().toLocaleString(),
				likes: 0,
				comments: 0
			});
	
		};
		if (message && modalHandler) {modalHandler(message);
		return 1;
		}
		else this.sendPosts();
	},
	sendPosts() {
		firebase.database().ref("post").set(this.allPosts);
	},
	addCommentToPosts({showAllPosts,showComments,postStarter}){
		const user = registration.user;
		const postId = postWrapper.querySelector(".post").attributes.numb.nodeValue;
		const postIndex = setPosts.allPosts.findIndex((obj) => obj.id === postId);
		if (!setPosts.allPosts[postIndex].comments) {
			setPosts.allPosts[postIndex].comments = new Array(0);
		}
		setPosts.allPosts[postIndex].comments.push({
			id: 		`commentID${(+new Date()).toString(16)}-${user.uid}`,
			email: 	user.email,
			text: 	addComment.text.value.replace(/<\/?[^>]+(>|$)/, ""),
			date:		new Date().toLocaleString(),
			author: user.displayName,
			avatar: user.photoURL,
		});
		this.sendPosts();
		this.setComments({
			postId,
			showAllPosts,
			showComments,
			postStarter
		});
	},

	getPosts(postStarter, showAllPosts,showComments, animation) {
		return new Promise((resolve)=>{
		firebase
			.database()
			.ref("post")
			.on("value", (snapshot) => {
				this.allPosts = snapshot.val() || [];
				if(registration.user){ 
				this.getUserSavedPosts().then((data)=>{this.savedPosts = data
				if (setPosts.commentsMode&&!this.likedPost) {
					const postId = postWrapper.querySelector(".post").attributes.numb.nodeValue;
					this.setComments({
														postId,
														postStarter,
														showAllPosts,
														showComments
													});
				} else if (!setPosts.commentsMode&&showAllPosts&&!this.likedPost) {
					postStarter(this.allPosts, showAllPosts, animation);
				}
				else if (this.likedPost){
					const likes = this.allPosts.find(obj=>obj.id===this.likedPost).likes.length || 0;
					// if(likes)
					// const likedByUser = likes.find(obj=>registration.user.uid===obj);
					Array.prototype.forEach.call(postWrapper.children,(post)=>{
						if(post.attributes.numb.nodeValue===this.likedPost){
							post.querySelector('.icon-like').classList.toggle('chosen');
							post.querySelector('.likes-counter').innerHTML = `${likes}`;
						}
					});
					this.likedPost=0;
				}
			})}
			else postStarter(this.allPosts, showAllPosts, animation);
			
			resolve();})

		})
	},

	iconHandler({target,postStarter,showAllPosts,showComments,commentFilter,postSaver,animation,animate}){
		if (target.classList.contains("icon")) {
			const postId = target.closest(".post").attributes.numb.nodeValue;
			if (target.classList.contains("icon-like") && registration.user) {
				this.editLikes(postId);
			} else if (target.classList.contains("icon-comment")) {
				commentFilter({showAllPosts,showComments})
				this.commentsMode = !setPosts.commentsMode ? 1 : this.commentsMode;
				this.setComments({
					postId,
					postStarter,
					showAllPosts,
					showComments,
					animation
				});
			}
			else if (target.classList.contains("icon-save")){
				this.postSaver(postId);
	
				if(target.classList.contains('chosen')) target.classList.remove('chosen');
				else target.classList.add('chosen');
				if(setPosts.savedPostsMode){
					target.closest('.post').remove();
					
				}
			}

		} else if (target.classList.contains("tag")) {
			this.tagFilter(target.text,postStarter,showAllPosts,animation);
		}
		else if (target.classList.contains("post-img")){
			const pics = Array.prototype.map.call(target.closest('.post-pics').children,obj=>obj.currentSrc);
			const current = pics.findIndex(obj => obj===target.currentSrc);
			slider.classList.toggle('visible');
			(sliderViewer = sliderHandler(pics,current,animate))()
		}
	},

	editLikes(postId) {
		this.likedPost = postId;
		const findPost = this.allPosts.findIndex((obj) => obj.id === postId);
		if (!this.allPosts[findPost].likes) {
			this.allPosts[findPost].likes = new Array(0);
		}
		const findUserLike = this.allPosts[findPost].likes.findIndex(
			(obj) => obj === registration.user.uid
		);
		if (findUserLike < 0) {
			this.allPosts[findPost].likes.push(registration.user.uid);
		} else if (findUserLike >= 0) {
			this.allPosts[findPost].likes.splice(findUserLike, 1);
			if (!this.allPosts[findPost].likes.length) {
				this.allPosts[findPost].likes = 0;
			}
		}
		this.sendPosts();
	},

	tagFilter(tag,postStarter,showAllPosts,animation) {
	
		if (this.commentsMode) {
			addComment.style.display = "";
			commentBlock.style.display = "";
		}
		const findPosts = this.allPosts.filter((post) => {
			let postEqual;
			if(post.tags){
			post.tags.forEach((obj) => {
				if (obj === tag) {
					postEqual = obj;
				}
			})}
			if (postEqual) return post;
		});
		postStarter(findPosts,showAllPosts,animation);
	},

	setComments({postId,authorPost=false,	postStarter,showAllPosts,showComments}) {
		const findPost = this.allPosts.find((obj) => obj.id === postId);
		findPost.comments = findPost.comments || [];
		const comments = authorPost ? findPost.comments.filter((comments) => findPost.mail === comments.email) : findPost.comments;
		addComment.style.display = registration.user ? "block" : "";
		commentBlock.style.display = "block";
		if(showAllPosts){
			postStarter ([findPost],showAllPosts,animation);}
		if(showComments)showComments(comments);
	}
};

const animation = ()=>{
	let cancel;
	const child = Array.prototype.map.call(postWrapper.children,obj=>obj);
	const fadeIn = ()=>{
	const breaker = child.find(post=>parseInt(getComputedStyle(post).opacity,10)<1);
	if(breaker){
	child.forEach(post =>{
		const currentOpacity = parseFloat(getComputedStyle(post).opacity);
		if(currentOpacity<=1) post.style.opacity = currentOpacity+0.02;
		});
	cancel = requestAnimationFrame(()=>fadeIn());
	}
	else cancelAnimationFrame(cancel)
	};
	fadeIn();
}

const scroller = (callback)=>{

	const scrollHeight = Math.max(
		document.body.scrollHeight, document.documentElement.scrollHeight,
		document.body.offsetHeight, document.documentElement.offsetHeight,
		document.body.clientHeight, document.documentElement.clientHeight
	);
	if(scrollY+100>=scrollHeight-document.documentElement.clientHeight){
		postViewer();
		if(callback)callback();
	}

}

const toggleModal = (message) => {
	if (message) {
		modal.classList.add("is-open");
		modalInner.innerHTML = message;
	} else {
		modal.classList.remove("is-open");
		modalInner.innerHTML = "";
	}
};

const toggleAuth = () => {
	const user = registration.user;
	if (user) {
		auth.style.display = "none";
		userLog.style.display = "flex";
		buttNewPost.style.display = "flex";
		userName.innerHTML = user.displayName;
		userAvatar.src = user.photoURL || "img/somecat.png";
		editForm.name.value = user.displayName;
		editForm.classList.add("visible");
		form.reset();
	} else {
		auth.style.display = "";
		userLog.style.display = "";
		buttNewPost.style.display = "";
		addComment.style.display = "";
		commentBlock.style.display = "";
		!addPost.classList.contains("visible") ? addPost.classList.toggle("visible")&&postWrapper.classList.toggle("visible"):'';

	}
};

const returnToMain = (postArr,postStarter,callback,animation) => {
	if (setPosts.commentsMode) {
		setPosts.commentsMode = 0;
	}
	addComment.style.display = "";
	commentBlock.style.display = "";
	if (!addPost.classList.contains("visible")) {
		postWrapper.classList.toggle("visible");
		addPost.classList.add("visible");
	}

	
postStarter(postArr,callback,animation);
};

const animate = (options)=>{
let {sliderImg,sliderImgWidth,change,currentPosition,ind,pix,side} = options;
let req;
const anim = ()=>{
	if ((currentPosition>window.innerWidth+sliderImgWidth&&!change)||(currentPosition<(0-sliderImgWidth)&&!change)){
		slider.replaceChild(pix[ind],sliderImg);
		sliderImg = pix[ind];
		sliderImgWidth = parseFloat(getComputedStyle(sliderImg).width)*-1;
		sliderImg.style.left = `${sliderImgWidth}px`;
		currentPosition = side===1 ? 0 : innerWidth;
		change+=1;
	}
	if((currentPosition>=window.innerWidth/2+sliderImgWidth/10&&change&&side===1)||(currentPosition<=window.innerWidth/2-sliderImgWidth/10&&change&&side===-1)){
		sliderImg.style.left = '';
		slider.addEventListener('click',picsMode);
		cancelAnimationFrame(req);
	}
	else {
		sliderImg.style.left = `${currentPosition+=(40)*side}px`
		req = requestAnimationFrame(anim);
	}
}
return anim 
	}

const sliderHandler = (pics,ind,animate) => {
		const pix = pics.map(pic => {
				const img = new Image();
				img.src = pic
				return img
		});

		return (side)=>{
		  const options = {
				pix : pix,
				sliderImg : slider.querySelector('img'),	
				ind : ind,
				change : 0,
				innerHandler (){
						this.sliderImgWidth = parseFloat(getComputedStyle(this.sliderImg).width);
						this.currentPosition = parseFloat(getComputedStyle(this.sliderImg).left);
					}
				};
		
			if(side){
					slider.removeEventListener('click', (event)=>picsMode(event));
					options.innerHandler();
					options.side = side;
					if (ind+side>pix.length-1) ind = 0;
					else if (ind+side<0) ind = pix.length-1;
					else ind += side;
					options.ind = ind;
					(animate(options))();
			}

			else slider.replaceChild(pix[options.ind],options.sliderImg);
			}
}





const postStarter = (postArr, callback, animation)=>{
	postWrapper.innerHTML = ``;
	postViewer = callback(postArr);
	while(postWrapper.clientHeight<window.innerHeight){
		const checker = postViewer();
		if(checker) break;
		}
		if(animation)animation();
	}

const showAllPosts = (posts) => {
	let count = 0;
	const data = setPosts.savedPosts
	return ()=>{
if(count>=posts.length)return 1
if(count<posts.length){
		const {id,title,text,pics,tags,author,avatar,date,likes,comments} = posts[count];
		const tagObj = tags? tags.map((tag) => `<a href="#${tag}" class="tag">${tag}</a>`).join(" ") : '';
		const postLikes = !likes ? 0 : likes.length;
		const postComments = !comments ? 0 : comments.length;
		const findUserLike =
			registration.user && postLikes ? posts[count].likes.find((obj) => obj === registration.user.uid) : null;
		const findSavedPost = registration.user && data.savedPosts ? data.savedPosts.find((obj)=>posts[count].id === obj) : null;
		const switchColorLikes = findUserLike ? "chosen" : "";
		const switchColorComments = setPosts.commentsMode ? "chosen" : "";
		const switchColorSaved = findSavedPost ? "chosen" : "";
	
		const containerWidth = postWrapper.closest('.posts-wrapper').offsetWidth;
		const pictures = pics ? pics.map((pic,index,arr) =>`<img src=${pic}  class="post-img" style="width:${containerWidth/arr.length-70/pics.length*2}px; margin: 0 ${Math.floor(5/pics.length)}px;" alt=""></img>`)
			.join(" ")
			: '';
		const addedPost = `
  <section class="post" numb = "${id}">
  <div class="post-body">
    <h2 class="post-title">${title}</h2>
			<p class="post-text">${text}</p>
			<div class="post-pics">${pictures}</div>
      <div class="tags">${tagObj}</div>  
  </div>
  <div class="post-footer">
  <div class="post-buttons">
  <button class="post-button likes"><svg width='19' height = '20'  class="icon icon-like ${switchColorLikes}">
    <use xlink:href="img/icons.svg#like"></use>
  </svg>
  <span class="likes-counter">${postLikes}</span>
  </button>
  <button class="post-button comments"><svg width='21' height = '21'  class="icon icon-comment ${switchColorComments}">
    <use xlink:href="img/icons.svg#comments"></use>
  </svg>
  <span class="comments-counter">${postComments}</span>
  </button>
	<button class="post-button save"><svg width='19' height = '19'  class="icon icon-save  ${switchColorSaved}">
    <use xlink:href="img/icons.svg#save"></use>
  </svg></button>
  <!--<button  class="post-button share">
    <svg width='17' height = '19'  class="icon icon-share">
      <use xlink:href="img/icons.svg#share"></use>
    </svg>
  </button>-->
  </div>
  <div class="post-author">
  <div class="author-about">
    <a href="" class="author-username">${author}</a>
    <span class="post-time">${date}</span>
  </div>
  <a href="#" class="author-link"><img src=${avatar} alt="" class="author-avatar"></a>
  </div> 
  </div>
	</section>`;
	
	postWrapper.insertAdjacentHTML('beforeend', addedPost)
	count>posts.length ? count = count : count++;
};
}
};

const showComments = (comments) => {
	commentsWrapper.innerHTML ='';
	if (!comments) {
		return;
	}
	comments.forEach((obj) => {
		const { text, date, avatar, author } = obj;

		commentsWrapper.innerHTML += `
<div class="comment-author">
<a href="#" class="comment-avatar">
<img src="${avatar}" alt="" class="comment-avatar_pic">
</a>
<a href="#" class="comment-username">${author}</a>
<span class="comment-time">${date}
</span>
</div>
<div class="comment-body">
<p class="comment-text">
${text}
</p>
</div>
`;
	});
};

const commentFilter = ({event,showAllPosts,showComments})=>{
	if(!setPosts.commentsMode){
		if(commentHeader.children[1].classList.contains("chosen")){
			[].forEach.call(commentHeader.children, (child) => child.classList.toggle("chosen"));
			return
		}
	}
	if(event){
	if (event.target.classList.contains("comments-filter")) {
		event.preventDefault();
		const filter = event.target;
		const postId = postWrapper.querySelector(".post").attributes.numb.nodeValue;
		let isAuthor;

		if (!filter.classList.contains("chosen")) {
			Array.prototype.forEach.call(commentHeader.children, child => child.classList.toggle("chosen"));
		}
		isAuthor = commentHeader.children[1].classList.contains("chosen");
		setPosts.setComments({
			postId,
			authorPost:isAuthor,
			postStarter,
			showAllPosts,
			showComments
		});
	}
}
};

const liveSearch=({postStarter,showAllPosts})=>{
	if(searchInput.value.trim()){
		const inputValue = searchInput.value.toLowerCase().trim();
		const neededPost = setPosts.allPosts
		.filter(post=>{
		if(post.title.toLowerCase().search(inputValue)!=-1||post.text.toLowerCase().search(inputValue)!=-1)return post;
		})
		.map((post)=>{
		let {id,mail,text,title,date,author,avatar,tags} = post;
		const titleIndex = post.title.toLowerCase().search(inputValue);
		const textIndex = post.text.toLowerCase().search(inputValue);
		title = titleIndex!=-1 ? post.title.slice(0,titleIndex) + '<span class="mark">' + post.title.slice(titleIndex,titleIndex+inputValue.length) + '</span>' + post.title.slice(titleIndex+inputValue.length) : post.title;
		text = textIndex!=-1 ? post.text.slice(0,textIndex) + '<span class="mark">' + post.text.slice(textIndex,textIndex+inputValue.length) + '</span>' + post.text.slice(textIndex+inputValue.length) : post.text;
		return {id,mail,title,text,date,author,avatar,tags};
		})
		||setPosts.allPosts;
		postStarter(neededPost,showAllPosts)
		}
		else {
		postStarter(setPosts.allPosts,showAllPosts)
		}
		if (setPosts.commentsMode) {
			setPosts.commentsMode = 0;
			addComment.style.display = "";
			commentBlock.style.display = "";
		}

	Array.prototype.forEach.call(postWrapper.children,post=>post.style.opacity = 1)
}

const headerMenuHandler = ({event,postStarter,showAllPosts,animation})=>{
	if(event.target.classList.contains('header-menu-link')){
		const array = [...setPosts.allPosts].map((obj=>obj));
		const headerItems = document.querySelectorAll('.header-menu-link');
		Array.prototype.forEach.call(headerItems,obj=>obj.classList.remove('chosen'));
		event.target.classList.add('chosen');
		new Promise ((resolve)=>{

	if(event.target.innerHTML === 'Лучшее'){
		array.sort((a,b) => {
			const aLike = a.likes ? a.likes.length : 0;
			const bLike = b.likes ? b.likes.length : 0;
			return bLike - aLike;
		});
		resolve()
}
	else if (event.target.innerHTML === 'Горячее'){
		array.sort((a,b) => {
			const aCom = a.comments ? a.comments.length : 0;
			const bCom = b.comments ? b.comments.length : 0;
			return bCom - aCom;
		});
		resolve()
}
//TODO
else if(event.target.innerHTML === 'Сохраненное'){
setPosts.getUserSavedPosts().then((data)=>{
const savedPosts = array.filter(post=>{
if(data.savedPosts.find(saved => post.id === saved))return post;
});
array.splice(0,array.length);
savedPosts.forEach((obj)=>array.push(obj));
setPosts.savedPostsMode = 1
resolve()
});
//TODO
}
else resolve();
}).then(()=>{
	if(event.target.innerHTML !== 'Сохраненное')setPosts.savedPostsMode = 0
	if (setPosts.commentsMode) {
		setPosts.commentsMode = 0;
		addComment.style.display = "";
		commentBlock.style.display = "";
	}
	///double code
	postStarter(array,showAllPosts,animation)

})


}
}

const picsMode = (event)=>{
	if (slider.classList.contains('visible')){
		if(event.target.classList.contains('visible')){
			event.target.classList.remove('visible');
		}
	}
	if(event.target.classList.contains('arrow')){
		if(event.target.classList.contains('left-arrow')){
			sliderViewer(-1);
		}
		else if (event.target.classList.contains('right-arrow')){
			sliderViewer (1);
		}
		slider.removeEventListener('click',picsMode);
	}
	}

const timer = ()=>{
	const currentData = new Date();
	const oneDay = 24*60*60*1000;
	let lastWeekPosts,postsTop,title,text,id
  const postsDate = setPosts.allPosts.map(post=>{
		const index = post.date.indexOf(',');
		let date,split
		if(post.date.includes('M')){
			split = post.date.slice(0,index).split('/');
			date = new Date(split[2],split[0]-1,split[1]);
			}
		else {
			split = post.date.slice(0,index).split('.');
			date = new Date(split[2], split[1]-1, split[0]);
			}
		return {id: post.id, date: Date.parse(date)}
		}
		);
 lastWeekPosts = postsDate.filter(obj=>{
	let dayCount = 0
	for (let i = currentData; i > obj.date ; i-=oneDay) {
	dayCount++	
	if (dayCount>20) break
	}
 if (dayCount<=7) return obj 
});

postsTop = setPosts.allPosts
	.filter(post =>{
				if(lastWeekPosts.find((obj)=>post.id===obj.id)){
					return post}})
	.sort((a,b)=>{
			const aLike = a.likes ? a.likes.length : 0;
			const bLike = b.likes ? b.likes.length : 0;
					return bLike - aLike;
});
id = postsTop[0].id;
title = postsTop[0].title;
text = postsTop[0].text.slice(0,postsTop[0].text.indexOf(' ',200));
postOfTheWeek.innerHTML = `
<div class="card-header">
  <h2 class="card-title">
    Пост недели
  </h2>
</div>
<div class="card-body" id = ${id}>
<a href="#" class="card-body-title">${title}</a>
<p class="card-text">
  ${text}...
</p>
</div>
`
}

const init = () => {
	
	toggle.addEventListener("click", event => {
		event.preventDefault();
		sideBar.classList.toggle("visible"); //burger-menu
	});

	form.addEventListener("submit", event => {
		event.preventDefault();
		registration.logIn({
			email:    form.username.value, 
			password: form.password.value, 
			callback: toggleModal
		});
		form.reset();
	});

	signUp.addEventListener("click", event => {
		event.preventDefault();
		registration.signIn({
			email:		form.username.value,
			password: form.password.value,
			callback: toggleModal
		});
	});

	userLogout.addEventListener("click", () => registration.logOut(toggleAuth));

	editButton.addEventListener("click", () => editForm.classList.toggle("visible"));

	editForm.addEventListener("submit", event => {
		event.preventDefault();
		registration.editUser({
			userName: editForm.name.value,
			userPhoto:editForm.photo.value,
			callback: toggleAuth,
			sendPosts:setPosts.sendPosts.bind(setPosts)
		});
	});

	buttNewPost.addEventListener("click", () => {
		postWrapper.classList.toggle("visible");
		addPost.classList.toggle("visible");
		const isComments = commentBlock.style.display === 'block';
		if(setPosts.commentsMode){
			addComment.style.display = isComments ? "" : 'block';
			commentBlock.style.display = isComments ? "" : 'block';
		}
	});

	addPost.addEventListener("submit", event => {
		event.preventDefault();
	console.dir(addPost.button);
		if(!setPosts.makePost(addPost,toggleModal)){
		postWrapper.classList.toggle("visible");
		addPost.classList.toggle("visible");
		addPost.reset();
	};
	});

	postWrapper.addEventListener("click", event => {
		event.preventDefault();
		const target = event.target
		setPosts.iconHandler({target, showAllPosts, showComments,commentFilter,postStarter,animation,sliderHandler,animate});
	});

	addComment.addEventListener("submit", event => {
		event.preventDefault();
		setPosts.addCommentToPosts({showAllPosts, showComments,postStarter});
		addComment.reset();
	});

	header.addEventListener("click", event => {
		event.preventDefault();
		const headerItems = document.querySelectorAll('.header-menu-link');
		Array.prototype.forEach.call(headerItems,obj=>obj.classList.remove('chosen'));
		setPosts.savedPostsMode = 0;
		headerItems[0].classList.add('chosen');
		returnToMain(setPosts.allPosts, postStarter, showAllPosts,animation);
	});

	addPhotoToPost.addEventListener('click', () =>{
		const input = addPost.querySelector('.add-photo-input');
		input.classList.toggle('visible');
	})


	slider.addEventListener('click',picsMode);


	searchInput.addEventListener('keyup', () =>liveSearch({postStarter,showAllPosts}));

	headerMenu.addEventListener('click',event=>headerMenuHandler({event,postStarter,showAllPosts,animation}))

	commentHeader.addEventListener("click", (event) => commentFilter({event,postStarter,showAllPosts,showComments}));


	modalConfirm.addEventListener("click", () => toggleModal());

	registration.initUser(toggleAuth, () => {
		setPosts.getPosts(postStarter, showAllPosts, showComments,animation).then(()=>{
			try {
				timer();
			}
				catch {
		console.log('нет постов за неделю');
				}
		})
	});



	window.addEventListener('scroll',()=> {
		if(postWrapper.clientHeight)scroller(animation);
	}
	);

	window.addEventListener('resize',()=>{
	const allPosts = postWrapper.querySelectorAll('.post');
	const width = postWrapper.closest('.posts-wrapper').offsetWidth;
	Array.prototype.forEach.call(allPosts, post => 
[].forEach.call(post.querySelectorAll('.post-img'),(img,index,arr)=>{
	if(img) {
		img.style.width = `${width/arr.length - 70/arr.length*2}px`;	
		img.style.margin = arr.length===1 ? '0 auto':`${Math.floor(10/arr.length)}px`;
}
}
))});
};

document.addEventListener("DOMContentLoaded", init);